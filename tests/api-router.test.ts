import { ApiRouter } from "../src/api-router";
import { IFilter } from "../src/filters/filter.interface";
import { HttpContext } from "../src/shared/http-context";
import { Controller } from "../src/decorators/controller";
import { Injectable, DependencyCollection } from "@miracledevs/paradigm-web-di";
import { Action } from "../src/decorators/action";
import { HttpMethod } from "../src/shared/http-method";
import { Logger } from "../src/logging/logger";
import { RoutingContext } from "../src/shared/routing-context";
import { ApiServer } from "../src/api-server";
import { ConfigurationBuilder } from "../src/configuration/configuration-builder";
import { InMemoryLogProvider } from "../src/logging/in-memory-log-provider";
import supertest from "supertest";

describe("API Router", () => {
    @Injectable()
    class RoutingFilter implements IFilter {
        public static beforeIndex = 0;

        public static afterIndex = 0;

        static reset(): void {
            RoutingFilter.beforeIndex = 0;
            RoutingFilter.afterIndex = 0;
        }

        beforeExecute(httpContext: HttpContext, routingContext: RoutingContext): void {
            ++RoutingFilter.beforeIndex;
        }

        afterExecute(httpContext: HttpContext, routingContext: RoutingContext): void {
            ++RoutingFilter.afterIndex;
        }
    }

    @Controller({ route: "routing", filters: [RoutingFilter] })
    class RoutingController {
        static var1?: number;

        static var2?: string;

        static var3?: boolean;

        static var4?: Date;

        static object?: any;

        static get?: boolean;

        static post?: boolean;

        static put?: boolean;

        static delete?: boolean;

        static reset(): void {
            RoutingController.var1 = undefined;
            RoutingController.var2 = undefined;
            RoutingController.var3 = undefined;
            RoutingController.var4 = undefined;
            RoutingController.object = undefined;

            RoutingController.get = undefined;
            RoutingController.post = undefined;
            RoutingController.put = undefined;
            RoutingController.delete = undefined;
        }

        @Action({ route: "action/:var1/:var2", query: ":var3&:var4", method: HttpMethod.GET, fromBody: false, filters: [RoutingFilter] })
        async routingAction(var1: number, var2: string, var3?: boolean, var4?: Date): Promise<void> {
            RoutingController.var1 = var1;
            RoutingController.var2 = var2;
            RoutingController.var3 = var3;
            RoutingController.var4 = var4;
        }

        @Action({ route: "pass-object", method: HttpMethod.POST, fromBody: true, filters: [RoutingFilter] })
        async routingObject(object: Object): Promise<void> {
            RoutingController.object = object;
        }

        @Action({ route: "wrong-param/:param" })
        async wrongParam(param: Object): Promise<void> {}

        @Action({ route: "return-object", method: HttpMethod.GET, fromBody: false, filters: [RoutingFilter] })
        async returnObject(): Promise<any> {
            return { value: "a value", name: "a name", array: [1, 2, 3] };
        }

        @Action({ route: "failing", method: HttpMethod.GET, fromBody: false, filters: [RoutingFilter] })
        async failingAction(): Promise<any> {
            throw new Error("This is an error");
        }

        @Action({ route: "finishing", method: HttpMethod.GET, fromBody: false, filters: [RoutingFilter] })
        finishingAction(httpContext: HttpContext): void {
            httpContext.status = 200;
            httpContext.body = "finished";
        }

        @Action()
        get(): void {
            RoutingController.get = true;
        }

        @Action()
        post(): void {
            RoutingController.post = true;
        }

        @Action()
        put(): void {
            RoutingController.put = true;
        }

        @Action()
        delete(): void {
            RoutingController.delete = true;
        }

        @Action({ route: "removable" })
        removableAction(): void {}
    }

    @Controller({ route: null as any })
    class EmptyRouteController {
        static executed: boolean = false;

        @Action()
        get(): void {
            EmptyRouteController.executed = true;
        }
    }

    @Controller({ route: "end/" })
    class EndWithBarController {
        static executed: boolean = false;

        @Action({ route: "action" })
        get(): void {
            EndWithBarController.executed = true;
        }
    }

    @Controller({ route: "boolean" })
    class BooleanParamController {
        static executed: boolean = false;
        static ptrue: boolean;
        static pyes: boolean;
        static p1: boolean;

        @Action({ route: ":ptrue/:pyes/:p1" })
        get(ptrue: boolean, pyes: boolean, p1: boolean): void {
            EmptyRouteController.executed = true;
            BooleanParamController.ptrue = ptrue;
            BooleanParamController.pyes = pyes;
            BooleanParamController.p1 = p1;
        }
    }

    @Controller({ route: "error" })
    class ErrorController {
        @Action({ route: "error", method: HttpMethod.GET })
        error(): void {
            throw new Error("Error class");
        }

        @Action({ route: "custom-error", method: HttpMethod.GET })
        customError(): void {
            throw { message: "Custom error" };
        }

        @Action({ route: "custom-object", method: HttpMethod.GET })
        customObject(): void {
            throw {
                text: "Custom object",
                toString: function () {
                    return this.text;
                },
            };
        }

        @Action({ route: "unknown-error", method: HttpMethod.GET })
        unknownError(): void {
            throw undefined;
        }
    }

    class MockServer extends ApiServer {
        constructor() {
            super(new ConfigurationBuilder(), DependencyCollection.globalCollection.buildContainer(), new Logger());
        }

        protected override configureApplication(): void {
            this.logger.setLogProvider(new InMemoryLogProvider());
            this.registerControllers([RoutingController, EmptyRouteController, EndWithBarController, BooleanParamController]);
        }

        protected override afterStart(): void {
            this.logger.info(`Starting server ${this.hostName ?? "localhost"}:${this.port ?? (this.httpServer.address() as any).port}`);
        }
    }

    it("should instantiate a new router", () => expect(new ApiRouter(new MockServer())).not.toBeNull());

    it("should register global filter", () => expect(() => new ApiRouter(new MockServer()).registerGlobalFilter(RoutingFilter)).not.toThrowError());

    it("should register global filters", () => expect(() => new ApiRouter(new MockServer()).registerGlobalFilters([RoutingFilter, RoutingFilter])).not.toThrowError());

    it("should register the routes", () => {
        const server = new MockServer();
        const router: ApiRouter = new ApiRouter(server);
        expect(() => router.registerRoutes()).not.toThrowError();
    });

    it("should call a registered the route", async () => {
        RoutingController.reset();
        const server = new MockServer();
        server.start();
        const request = supertest(server.httpServer);
        const response = await request.get("/routing/action/1/hello?var3=true&var4=2012-12-12");
        expect(response.status).toBe(204);
        expect(response.text).toBe("");
        expect(RoutingController.var1).toBe(1);
        expect(RoutingController.var2).toBe("hello");
        expect(RoutingController.var3).toBe(true);
        expect(RoutingController.var4).not.toBeNull();
        await server.stop();
    });

    it("should map body object to parameter", async () => {
        RoutingController.reset();
        const server = new MockServer();
        server.start();
        const request = supertest(server.httpServer);
        const response = await request
            .post("/routing/pass-object")
            .set("content-type", "application/json")
            .send({ value: "a value", name: "a name", array: [1, 2, 3] });

        expect(response.status).toBe(204);
        expect(response.text).toBe("");
        expect(RoutingController.object).not.toBeNull();
        expect(RoutingController.object.value).toBe("a value");
        expect(RoutingController.object.name).toBe("a name");
        expect(RoutingController.object.array).toHaveLength(3);
        await server.stop();
    });

    it("should return an object", async () => {
        RoutingController.reset();
        const server = new MockServer();
        server.start();
        const request = supertest(server.httpServer);
        const response = await request.get("/routing/return-object");
        expect(response.status).toBe(200);

        const result = response.body;

        expect(result).not.toBeNull();
        expect(result.value).toBe("a value");
        expect(result.name).toBe("a name");
        expect(result.array).toHaveLength(3);

        await server.stop();
    });

    it("should allow a method to fail", async () => {
        RoutingController.reset();
        const server = new MockServer();
        server.start();
        const request = supertest(server.httpServer);
        const response = await request.get("/routing/failing");
        expect(response.status).toBe(500);
        expect(response.text).toBe("This is an error");
        await server.stop();
    });

    it("should call all the filters", async () => {
        RoutingFilter.reset();
        RoutingController.reset();

        const server = new MockServer();
        server.routing.registerGlobalFilter(RoutingFilter);
        server.start();
        const request = supertest(server.httpServer);
        const response = await request.get("/routing/action/1/hello?var3=true&var4=2012-12-12");
        expect(response.status).toBe(204);
        expect(response.text).toBe("");
        expect(RoutingController.var1).toBe(1);
        expect(RoutingController.var2).toBe("hello");
        expect(RoutingController.var3).toBe(true);
        expect(RoutingController.var4).not.toBeNull();
        expect(RoutingFilter.afterIndex).toBe(3);
        await server.stop();
    });

    it("should fail if a method does not exist", async () => {
        RoutingController.reset();
        const method = RoutingController.prototype.removableAction;
        RoutingController.prototype.removableAction = undefined as any;

        const server = new MockServer();
        server.start();
        const request = supertest(server.httpServer);
        const response = await request.get("/routing/removable");
        expect(response.status).toBe(500);
        expect(response.text).toBe("The method or action 'removableAction' does not exist in 'RoutingController'.");
        await server.stop();

        RoutingController.prototype.removableAction = method;
    });

    it("should finish the response in the controller", async () => {
        RoutingController.reset();
        const server = new MockServer();
        server.start();
        const request = supertest(server.httpServer);
        const response = await request.get("/routing/finishing");
        expect(response.status).toBe(200);
        expect(response.text).toBe("finished");
        await server.stop();
    });

    it("should execute a get method", async () => {
        RoutingController.reset();
        const server = new MockServer();
        server.start();
        const request = supertest(server.httpServer);
        const response = await request.get("/routing");
        expect(response.status).toBe(204);
        await server.stop();
    });

    it("should execute a post method", async () => {
        RoutingController.reset();
        const server = new MockServer();
        server.start();
        const request = supertest(server.httpServer);
        const response = await request.post("/routing");
        expect(response.status).toBe(204);
        await server.stop();
    });

    it("should execute a put method", async () => {
        RoutingController.reset();
        const server = new MockServer();
        server.start();
        const request = supertest(server.httpServer);
        const response = await request.put("/routing");
        expect(response.status).toBe(204);
        await server.stop();
    });

    it("should execute a delete method", async () => {
        RoutingController.reset();
        const server = new MockServer();
        server.start();
        const request = supertest(server.httpServer);
        const response = await request.delete("/routing");
        expect(response.status).toBe(204);
        await server.stop();
    });

    it("should fail if parameter type is not recognized", async () => {
        RoutingController.reset();
        const server = new MockServer();
        server.start();
        const request = supertest(server.httpServer);
        const response = await request.get("/routing/wrong-param/1");
        expect(response.status).toBe(500);
        expect(response.text).toBe("The parameter 'param' is of type 'Object'. Only Number, String, Date or Boolean are allowed for route or query string parameters.");
        await server.stop();
    });

    it("should execute an action from a controller without route", async () => {
        const server = new MockServer();
        server.start();
        const request = supertest(server.httpServer);
        const response = await request.get("/");
        expect(response.status).toBe(204);
        expect(EmptyRouteController.executed).toBe(true);
        await server.stop();
    });

    it("should execute an action from a controller that ends with a /.", async () => {
        const server = new MockServer();
        server.start();
        const request = supertest(server.httpServer);
        const response = await request.get("/end/action");
        expect(response.status).toBe(204);
        expect(EndWithBarController.executed).toBe(true);
        await server.stop();
    });

    it("should convert all types of boolean to be true", async () => {
        const server = new MockServer();
        server.start();
        const request = supertest(server.httpServer);
        const response = await request.get("/boolean/true/yes/1");
        expect(response.status).toBe(204);
        expect(BooleanParamController.ptrue).toBeTruthy();
        expect(BooleanParamController.pyes).toBeTruthy();
        expect(BooleanParamController.p1).toBeTruthy();
        await server.stop();
    });

    it("should catch errors", async () => {
        const server = new MockServer();
        server.start();
        const request = supertest(server.httpServer);

        let response = await request.get("/error/error");
        expect(response.status).toBe(500);
        expect(response.text).toBe("Error class");

        response = await request.get("/error/custom-error");
        expect(response.status).toBe(500);
        expect(response.text).toBe("Custom error");

        response = await request.get("/error/custom-object");
        expect(response.status).toBe(500);
        expect(response.text).toBe("Custom object");

        response = await request.get("/error/unknown-error");
        expect(response.status).toBe(500);
        expect(response.text).toBe("Unknown error");

        await server.stop();
    });
});
