import { ApiRouter } from "./api-router";
import { Logger } from "./logging/logger";
import { ConfigurationBuilder } from "./configuration/configuration-builder";
import { DependencyContainer, ObjectType } from "@miracledevs/paradigm-web-di";
import Koa from "koa";
import bodyParser from "koa-bodyparser";
import { Server } from "http";

export class ApiServer {
    private readonly _controllers: ObjectType[];

    private _koaApplication: Koa;

    private _httpServer?: Server;

    private _routing: ApiRouter;

    private _port?: number;

    private _hostName?: string;

    get configurationBuilder(): ConfigurationBuilder {
        return this._configurationBuilder;
    }

    get koaApplication(): Koa {
        return this._koaApplication;
    }

    get dependencyContainer(): DependencyContainer {
        return this._dependencyContainer;
    }

    get routing(): ApiRouter {
        return this._routing;
    }

    get logger(): Logger {
        return this._logger;
    }

    get controllers(): ObjectType[] {
        return this._controllers;
    }

    get port(): number | undefined {
        return this._port;
    }

    protected set port(port: number | undefined) {
        this._port = port;
    }

    get hostName(): string | undefined {
        return this._hostName;
    }

    protected set hostName(hostName: string | undefined) {
        this._hostName = hostName;
    }

    get httpServer(): Server {
        if (!this._httpServer) throw new Error("The server is not running. Please call start first.");
        return this._httpServer!;
    }

    constructor(private readonly _configurationBuilder: ConfigurationBuilder, private readonly _dependencyContainer: DependencyContainer, private readonly _logger: Logger) {
        this._controllers = [];
        this._koaApplication = new Koa();
        this._routing = new ApiRouter(this);
    }

    public start(): void {
        // the solution expects body content to be parsed to work
        // because we invoke actions sending body content, route params
        // and query string parameters as arguments to the action.
        this._koaApplication.use(bodyParser(this.getBodyParserConfiguration()));

        // configure general aspects of the application
        // like cors, or any other custom middleware required.
        // it also gives control flow to the user to register
        // controllers and filters.
        this.configureApplication();

        // registers the main and nested routers.
        this._routing.registerRoutes();

        // start the server.
        this.listen();
    }

    public stop(): void {
        this._httpServer?.close();
    }

    protected configureApplication(): void {
        // override to configure koa application.
    }

    protected getBodyParserConfiguration(): bodyParser.Options | undefined {
        // override to configure the body parser.
        return undefined;
    }

    protected listen(): void {
        // override to change listener configuration.
        this._httpServer = this._koaApplication.listen(this._port, this._hostName);
    }

    protected registerController(controller: ObjectType): void {
        this._controllers.push(controller);
    }

    protected registerControllers(controllers: ObjectType[]): void {
        for (const controller of controllers) {
            this.registerController(controller);
        }
    }
}
