import Router from "@koa/router";
import Koa from "koa";
import { HttpContext } from "./shared/http-context";
import { HttpMethod } from "./shared/http-method";
import { IFilter } from "./filters/filter.interface";
import { ILogger } from "./logging/logger.interface";
import { ControllerTypeCollection } from "./decorators/controller-type-collection";
import { ControllerType } from "./decorators/controller-type";
import { ActionType } from "./decorators/action-type";
import { ActionTypeCollection } from "./decorators/action-type-collection";
import { RouteParameterType } from "./decorators/action-url";
import { ActionMethod } from "./shared/action-method";
import { DependencyContainer, ObjectType, DependencyCollection } from "@miracledevs/paradigm-web-di";
import { getObjectTypeName } from "@miracledevs/paradigm-web-di/object-type";
import { RoutingContext } from "./shared/routing-context";
import { ApiServer } from "./api-server";

export class ApiRouter {
    public static readonly ThreadScope = "thread";

    private readonly _server: ApiServer;

    private readonly _logger: ILogger;

    private readonly _dependencyContainer: DependencyContainer;

    private readonly _mainRouter: Router;

    private readonly _routers: Map<string, Router>;

    private readonly _globalFilters: ObjectType<IFilter>[];

    private _ignoreClosedResponseOnFilters: boolean;

    constructor(server: ApiServer) {
        this._server = server;
        this._logger = server.logger;
        this._dependencyContainer = server.dependencyContainer;
        this._globalFilters = [];
        this._mainRouter = new Router();
        this._routers = new Map<string, Router>();
        this._ignoreClosedResponseOnFilters = false;
    }

    public ignoreClosedResponseOnFilters(): void {
        this._ignoreClosedResponseOnFilters = true;
    }

    public registerGlobalFilter(filter: ObjectType<IFilter>): void {
        this._globalFilters.push(filter);
    }

    public registerGlobalFilters(filters: ObjectType<IFilter>[]): void {
        for (const filter of filters) {
            this._globalFilters.push(filter);
        }
    }

    public registerRoutes(): void {
        for (const controllerType of ControllerTypeCollection.globalInstance.getControllers()) {
            for (const actionType of ActionTypeCollection.globalInstance.getForController(controllerType.type.name)) {
                const routingContext = new RoutingContext(controllerType, actionType);
                const route = this.mergeRoute(routingContext);
                // const { router } = this.getRouter(controllerType);
                const router = this._mainRouter;
                const method = this.getMethod(actionType, router);

                method.call(router, route, async (httpContext: HttpContext) => await this.callAction(httpContext, routingContext));
                this._logger.debug(`Mapping route ${HttpMethod[actionType.descriptor.method ?? HttpMethod.GET]} ${route} to '${routingContext}'.`);
            }

            ////////////////////////////////////////////////////////////////////////////////
            // nested routers seems to be malfunctioning still 5/22/2022
            // routes respond with a 404 if we use nested routers.
            // https://github.com/ZijianHe/koa-router/issues/244
            ////////////////////////////////////////////////////////////////////////////////
            // const { router, controllerRoute } = this.getRouter(controllerType);
            // this._mainRouter.use(controllerRoute, router.routes(), router.allowedMethods());
            ////////////////////////////////////////////////////////////////////////////////
        }

        this._server.koaApplication.use(this._mainRouter.routes());
        this._server.koaApplication.use(this._mainRouter.allowedMethods());
    }

    private getRouter(controllerType: ControllerType): { router: Router; controllerRoute: string } {
        let controllerRoute = controllerType.descriptor.route || "";
        if (controllerRoute.endsWith("/")) controllerRoute = controllerRoute.substr(0, controllerRoute.length - 1);

        let router = this._routers.get(controllerRoute);
        if (router) return { router, controllerRoute };

        router = new Router() as Router;
        this._routers.set(controllerRoute, router);
        return { router, controllerRoute };
    }

    private async callAction(httpContext: HttpContext, routingContext: RoutingContext): Promise<void> {
        // create a new scoped injector
        const scopedDependencyContainer = this._dependencyContainer.createScopedInjector(ApiRouter.ThreadScope);

        // join all the filters.
        const filters = this._globalFilters.concat(routingContext.controllerType.descriptor.filters ?? [], routingContext.actionType.descriptor.filters ?? []);

        // resolve the filter instances
        const filterInstances = filters.map(x => scopedDependencyContainer.resolve(x) as IFilter);

        try {
            this._logger.debug(`Request received '${httpContext.request.url}'`);

            // check if the response is still alive.
            this.checkResponse(httpContext, routingContext);

            // try to instantiate the controller.
            const controllerInstance = this.createControllerInstance(routingContext, scopedDependencyContainer);

            // try to retrieve the method.
            const actionMethod = this.getActionMethod(routingContext, controllerInstance);

            // execute before filters.
            await this.executeFilters(filterInstances, httpContext, async (f: IFilter) => {
                if (f.beforeExecute) await f.beforeExecute(httpContext, routingContext);
            });

            // reverses the array to execute filters in the in-to-out order instead of out-to-in that we used for the before events.
            filterInstances.reverse();

            // execute the action itself.
            const result = await this.executeMethod(controllerInstance, actionMethod, routingContext, httpContext);

            // execute the after filters.
            await this.executeFilters(filterInstances, httpContext, async (f: IFilter) => {
                if (f.afterExecute) await f.afterExecute(httpContext, routingContext);
            });

            // finish the request if wasn't finished already
            this.finishRequest(httpContext, result);

            // log the resulting operation.
            this._logger.debug(`Action returned with code [${httpContext.response.status}].`);
        } catch (e) {
            // log the exception.
            const error = this.getError(e);
            this._logger.error(error.message);

            // execute the after filters.
            await this.executeFilters(filterInstances, httpContext, async (f: IFilter) => {
                if (f.onError) await f.onError(httpContext, routingContext, error);
            });

            // close with error.
            httpContext.status = 500;
            httpContext.body = error.message;
        }
    }

    private getError(error: unknown): Error {
        if (error instanceof Error) return error;
        else if ((error as any).message) {
            return new Error((error as any).message);
        } else if ((error as any).toString) {
            return new Error((error as any).toString());
        } else {
            return new Error("Unknown Error");
        }
    }

    private checkResponse(httpContext: HttpContext, routingContext: RoutingContext): void {
        if (httpContext.closed) {
            this._logger.debug(`The response is already closed, the action '${routingContext}' won't be called.`);
            return;
        }

        this._logger.debug(`The action '${routingContext}' will be executed.`);
    }

    private createControllerInstance(routingContext: RoutingContext, dependencyContainer: DependencyContainer): any {
        return dependencyContainer.resolve(routingContext.controllerType.type);
    }

    private getActionMethod<T = any>(routingContext: RoutingContext, controllerInstance: any): ActionMethod<T> {
        return routingContext.actionType.getExecutableMethod(controllerInstance);
    }

    private async executeMethod(controllerInstance: any, actionMethod: ActionMethod<any>, routingContext: RoutingContext, httpContext: HttpContext): Promise<void> {
        const methodArgs: any[] = [];

        // 1. if the method was tagged as expecting the body to be an object
        //    then send the parsed body as first parameter in the array.
        if (routingContext.actionType.descriptor.fromBody) methodArgs.push(httpContext.request.body);

        // 2. get all the route params and query string optional params to
        //    pass them along (after parsing them) as method arguments.
        const routeArgs = this.getParametersArray(routingContext.actionType, httpContext);
        const args = methodArgs.concat(routeArgs);

        // 3. finally, and optionally, pass the http context and routing context
        //    to the action itself, in case the user wants to meddle with the context.
        args.push(httpContext, routingContext);

        return await actionMethod.apply(controllerInstance, args);
    }

    private finishRequest(httpContext: HttpContext, result: any): void {
        if (!httpContext.body && result) httpContext.body = result;
        httpContext.status = httpContext.body ? 200 : 204;
    }

    private mergeRoute(routingContext: RoutingContext): string {
        const controllerRoute = this.normalizeSlashes(routingContext.controllerType.descriptor.route || "", false);
        const actionRoute = this.normalizeSlashes(routingContext.actionType.descriptor.route || "", true);
        return `${controllerRoute}${actionRoute}`;
    }

    private normalizeSlashes(route: string, allowEmpty: boolean = false): string {
        if (!route && allowEmpty) return "";
        if (route.endsWith("/")) route = route.substr(0, route.length - 1);
        if (!route.startsWith("/")) route = `/${route}`;
        return route;
    }

    private getMethod(actionType: ActionType, router: Router): any {
        switch (actionType.descriptor.method) {
            case HttpMethod.GET:
                return router.get;

            case HttpMethod.POST:
                return router.post;

            case HttpMethod.PUT:
                return router.put;

            case HttpMethod.DELETE:
                return router.delete;
        }
    }

    private async executeFilters(filterInstances: IFilter[], httpContext: HttpContext, action: (filter: IFilter) => Promise<void>): Promise<void> {
        if (!filterInstances || filterInstances.length === 0) return;

        for (const filterInstance of filterInstances) {
            if (httpContext.closed && !this._ignoreClosedResponseOnFilters) break;

            await action(filterInstance);
        }
    }

    private getParametersArray(actionType: ActionType, context: HttpContext): any[] {
        return actionType.actionUrl.parameters.map((routeParameter, index) => {
            const parameter = (routeParameter.parameterType === RouteParameterType.Segment ? context.params[routeParameter.name] : context.query[routeParameter.name]) as string;

            if (!parameter) return undefined;

            switch (actionType.parameters[index]) {
                case Number:
                    return parseFloat(parameter);

                case Boolean:
                    return parameter.toLowerCase() === "true" || parameter.toLowerCase() === "yes" || parameter.toLowerCase() === "1";

                case Date:
                    return new Date(Date.parse(parameter));

                case String:
                    return parameter;

                default:
                    throw new Error(
                        `The parameter '${routeParameter.name}' is of type '${getObjectTypeName(
                            actionType.parameters[index]
                        )}'. Only Number, String, Date or Boolean are allowed for route or query string parameters.`
                    );
            }
        });
    }
}
