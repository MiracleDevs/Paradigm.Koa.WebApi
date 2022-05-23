[![Paradigm Koa WebApi](https://github.com/MiracleDevs/Paradigm.Koa.WebApi/actions/workflows/build-and-test.yml/badge.svg?branch=main)](https://github.com/MiracleDevs/Paradigm.Koa.WebApi/actions/workflows/build-and-test.yml)

# Paradigm.Koa.WebApi <!-- omit in toc -->

A port of [Paradigm.Express.WebApi](https://github.com/MiracleDevs/Paradigm.Express.Web.Api) to use koa as the internal server and router. The objective is still provide a clear architecture and patterns to work on webapis, allowing async methods, clear server-agnostic interfaces for controller and services, and include filters, which not only include the http context, but the routing context, with metadata about controllers and actions.

## Table of Contents <!-- omit in toc -->

-   [Package Configuration](#package-configuration)
-   [Migrating from Paradigm.Express.WebApi](#migrating-from-paradigmexpresswebapi)
    -   [HttpContext](#httpcontext)
    -   [Request and Response](#request-and-response)
    -   [Controllers](#controllers)
    -   [ApiServer](#apiserver)
        -   [Construction](#construction)
        -   [Configuration](#configuration)
        -   [Body Parser](#body-parser)
        -   [Stopping the server](#stopping-the-server)

## Package Configuration

This Solution is configured to use Prettier, eslint and to format the source code before commit after a stage operation. The CI scripts also checks format when running the actions.

## Migrating from Paradigm.Express.WebApi

This framework is based on [Paradigm.Express.WebApi](https://github.com/MiracleDevs/Paradigm.Express.Web.Api) but there are some important changes and departures from the Express version. We'll try to list all the differences:

### HttpContext

This version utilizes Koa Context as a replacement of our HttpContext class. There's no need to have our own context any more. But for naming sake, we are still exporting Koa.Context as HttpContext, to differentiate from the RoutingContext. The interface of the object differs slightly, the property finished does not exist any more.

### Request and Response

The request and response objects are now Koa objects, and some of the properties and methods are different. Most notably response can't be finished, filters can overwrite the response body, and there's now off-the-shelf solution to track. You can check if the body posses values or not, or if the status has been set or not.

**Important**: Response can not be finished, and all filters will ran, there's no more avoid filters when response is finished. So you'll need to verify manually.

### Controllers

In previous versions, controller classes needed to extend the `ApiController` class. `ApiController` class was removed and now controllers can be standalone classes without constraints on the framework side.

```ts
@Controller({ route: "api/product" })
export class ProductController {}
```

**Important**: The ApiController base class provided a reference to the HttpContext class. In this new framework you can access the `HttpContext` and `RoutingContext` by adding them to your action as the last two arguments of your method:

```ts
@Action({ route: 'myaction/:arg1/:arg2' })
myAction(arg1: number, arg2: string, httpContext: HttpContext, routingContext: RoutingContext): Promise<void>
{
}
```

You can ignore these two parameters if you don't need them.

### ApiServer

The api sever suffered some modifications too.

#### Construction

Now the server will be constructed with dependency injection, and the `ConfigurationBuilder`, `DependencyContainer` and `Logger` will be passed to the constructor method. If you don't need to construct something, you can leave the class without constructor. If you do need to add new dependencies, you can pass the dependencies using the super notation.

```ts
export class MyServer extends ApiServer {}
```

or

```ts
export class MyServer extends ApiServer {
    constructor(
        configurationBuilder: ConfigurationBuilder,
        dependencyContainer: DependencyContainer,
        logger: Logger,
        myService: MyService) {
            super(configurationBuilder, dependencyContainer, logger);
            ...
        }
}
```

#### Configuration

When configuring the `ApiServer`, there's no need to execute the listen method, now, this will happen internally in the base class, so you class should only add middlewares, register controllers and filters.

```ts
class Server extends ApiServer {
    protected override configureApplication(): void {
        super.configureApplication();
        this.registerControllers([Controller1, Controller2, Controller3]);
        this.routing.registerGlobalFilter(GlobalFilter);
    }
}
```

If you want to change the port or host name, you can set them in the `configureApplication` method by setting the properties `port` and `hostName`:

```ts
class Server extends ApiServer {
    protected override configureApplication(): void {
        super.configureApplication();
        this.registerControllers([Controller1, Controller2, Controller3]);
        this.routing.registerGlobalFilter(GlobalFilter);

        this.port = 3000;
        this.hostName = "0.0.0.0";
    }
}
```

If you need a more advanced approach, or you want to configure the `koaApplication.listen` callback, you can override the `ApiServer.listen` method:

```ts
class Server extends ApiServer {
    protected override configureApplication(): void {
        super.configureApplication();
        this.registerControllers([Controller1, Controller2, Controller3]);
        this.routing.registerGlobalFilter(GlobalFilter);

        this.port = 3000;
        this.hostName = '0.0.0.0';
    }

    protected override listen(): void {
        this._httpServer = this.koaApplication.listen(this.port, this.hostName, () => /* do something */);
    }
```

#### Body Parser

The solution expects a body parser configured to make the automatic logic function as expected (receiving objects as parameters from body, or returning object to serialize in the response body). Because of that, the `ApiServer` now configures koa BodyParser library by default. Because the defaults may not align with your use case, you can override the method and configure it as you need it:

```ts
class Server extends ApiServer {
    protected override getBodyParserConfiguration(): bodyParser.Options | undefined {
        return {
            detectJSON: function (ctx) {
                return /\.json$/i.test(ctx.path);
            }
        };
    }
```

#### Stopping the server

One of the main differences between Koa and Express, is that Koa doesn't extend the node structure, but provides a communication with it. The listen method creates a standard node http server, and now the user will have control over this server under `httpServer` property. Another new feature, is the ability to stop the http server when no needed, calling the `stop` method.
