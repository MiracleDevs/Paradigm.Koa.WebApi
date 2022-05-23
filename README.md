[![Paradigm Koa WebApi](https://github.com/MiracleDevs/Paradigm.Koa.WebApi/actions/workflows/build-and-test.yml/badge.svg?branch=main)](https://github.com/MiracleDevs/Paradigm.Koa.WebApi/actions/workflows/build-and-test.yml)

# Paradigm.Koa.WebApi <!-- omit in toc -->

A port of [Paradigm.Express.WebApi](https://github.com/MiracleDevs/Paradigm.Express.Web.Api) to use koa as the internal server and router. The objective is still provide a clear architecture and patterns to work on webapis, allowing async methods, clear server-agnostic interfaces for controller and services, and include filters, which not only include the http context, but the routing context, with metadata about controllers and actions.

## Table of Contents <!-- omit in toc -->

-   [Installing](#installing)
-   [Getting Started](#getting-started)
    -   [Host Builder](#host-builder)
    -   [Api Server](#api-server)
    -   [Controllers and Actions](#controllers-and-actions)
    -   [Filters](#filters)
-   [Version History](#version-history)
    -   [1.0.0](#100)
-   [Building and Testing](#building-and-testing)
-   [Package Configuration](#package-configuration)
-   [Migrating from Paradigm.Express.WebApi](#migrating-from-paradigmexpresswebapi)
    -   [HttpContext](#httpcontext)
    -   [Request and Response](#request-and-response)
    -   [Controllers](#controllers)
    -   [ConfigurationBuilder](#configurationbuilder)
    -   [ApiServer](#apiserver)
        -   [Construction](#construction)
        -   [Configuration](#configuration)
        -   [Body Parser](#body-parser)
        -   [Stopping the server](#stopping-the-server)

## Installing

```shell
$ npm i @miracledevs/paradigm-koa-webapi
```

## Getting Started

There are 4 basic entities that form the framework that you'll be using extensively:

1. Host Builders
2. ApiServers
3. Controller and Actions
4. Filters

### Host Builder

Is the entry point of the application. The host builder allows you to create the API Server, and configure some subjacent objects, like the dependency container. In the most simple way, you just need to have an `ApiServer` class, and you can create and start your app:

```typescript
new HostBuilder().build(Server).start();
```

The host builder let you customize the application logging, dependency injection and configuration. Some things can be changed latter, but we recommend doing it here:

```typescript
new HostBuilder()
    .useConfiguration((config: ConfigurationBuilder) =>
    {
        config.addJsonFile('config.json')
            .addEnvironmentFile('.env', 'my_app__')
            .addEnvironmentVariables('my_app__');
    })
    .useLogging((logger: Logger) => logger.setMinimumLevel(LogType.Trace))
    /* best not to change the DI unless you know what you are doing */
    .useDependencyInjection(() => return new DependencyCollection())
    .build(FooServer)
    .start();
```

1. In this case, we use `useConfiguration` to initialize the `ConfigurationBuilder` to initialize our configuration. We are telling the framework to open `config.json`, then `.env` and the environment variables, and merge them all into one configuration object. We are telling the configuration to look only for .env variables that start with `my_app__`. We'll see this later when exploring how the configuration works.

2. Then we are telling the app that we can configure the logger by calling `useLogging`. We setup the
   logger to log everything from Trace up (Trace, Debug, Information, Warning, Error). You can also configure the message format, or change the log provider. By default, the logger logs to the console terminal.

3. Then we are telling the host that we want to use a custom dependency collection, by calling `useDependencyInjection`. If not, the host will use `DependencyCollection.globalCollection`. We recommend not call this method, and let the host use the globalCollection.

4. Then we call `build` and we pass which class we want to create. This class must inherit from `ApiServer`. The host will instantiate the class and inject the logger, dependency container and configuration to the server instance.

5. The last method is the `start` method. At this point we already have an instance of our api server, and we can start the app.

### Api Server

The api server is the class we need to extend in order to create our server application. Internally maintains references to a logger, a dependency container, a configuration builder, and all the referenced controllers. Is also the instance that maintains the koa application, the http server, and all the routing information. Your `HostBuilder` and `ApiServer` will be the application entry point, and so you should register which controllers you want here. You'll also want to configure your koa application:

```typescript
export class FooServer extends ApiServer {
    protected configureApplication(): void {
        this.logger.debug("Configuring application...");
        const configuration = this.configurationBuilder.build(FooConfiguration);

        this.port = configuration.port;
        this.hostName = configuration.hostName;
        this.koaApplication.use(cors());

        this.registerControllers([LoginController, ProductController]);
    }
}
```

Most of the logic inside the `ApiServer` happens behind the curtains. Your only responsibility is to configure the koa application, and register your controllers. You can do so by overriding the `configureApplication` application inside your `ApiServer` class. Inside, we are:

1. Initializing our configuration object, by asking the configuration builder to create our object: `this.configurationBuilder.build()`. When we call this line, the configuration builder executes each configuration source step configured in the `HostBuilder` and then merges the results into one object. We can ask the framework to instantiate a specific configuration class instead of just returning a generic object. That's why we are calling build and passing `FooConfiguration` as parameter. `FooConfiguration` is a class with all the proper fields:

```typescript
export class FooConfiguration {
    development: boolean;
    port: number;
    hostName: string;
    adminSecret: string;
}
```

2. Once we have a configuration instance, we can configure our koa application. We can setup which type of responses and request are we expecting, if we want cors or not, which port to use, etc.

3. Finally, we register which controllers do we want to have in scope. We are just putting them on scope for the tree shacking algorithms.

That's it. We should have a working koa application up and running.

### Controllers and Actions

Controllers and actions are the most common type of objects under this structure. Instead of just laying your routes altogether, our framework allows you a modular separation for your routes, with some other goodies will see. We'll create an example controller:

```typescript
@Controller({ route: "api/product" })
export class ProductController {
    constructor(private readonly productService: ProductService) {}

    @Action({ route: "single/:id" })
    async get(id: number): Promise<Product> {
        return await this.productService.get(id);
    }

    @Action({ route: "all", method: HttpMethod.GET })
    async getAll(): Promise<Product[]> {
        return await this.productService.getAll();
    }

    @Action({ fromBody: true })
    async post(product: Product): Promise<void> {
        await this.productService.save(product);
    }

    @Action({ route: ":id" })
    async delete(id: number): Promise<void> {
        await this.productService.delete(id);
    }
}
```

Each controller is a class that contains a set of actions, that will be routed or called. Each action will define an endpoint. Its url will be the composition of the controller and action routes. By convention, the framework can infer the http method by the action name. The are plenty of configurations possible for you to play with, but lets list some of the most important:

-   Our framework can automatically match and cast your route and query string parameters and pass them to the action method. No more request and response parameters in your routing methods. The framework will take care of parameters for you. You can use parameters of type `number`, `string`, `boolean` or `Date`.
-   Like with route and query string parameters, the framework can extract an object from the body, and inject it on your action. In order to inject the body object, you must provide the option `fromBody: true` and expect the first parameter to be the object. You can mix route and query string parameters with the body object, just make sure the object to be the first parameter.
-   You don't need to manually set the `httpContext.body` or the `httpContext.status`. The framework can do it for you. Just expose a http agnostic interface. Do you want to return an array of products? make your action return products. The framework will take them and serialize it on the response body.
-   In case you want to manually modify the response, then add as the two last arguments of your action the following: `httpContext: HttpContext, routingContext: RoutingContext` and you'll be able to manually modify the body, status or any other property.
-   You can work with sync or async methods. You can choose which one fit you best, the framework will work either way.
-   Controllers are registered in the `DependencyCollection.globalCollection` by default, and the framework which resolve them via DI resolution. That means that you can inject your services or helper classes on the controller constructor, and have them ready to use.

### Filters

The last important group of elements you need to know, are the filters. Filters can be attached to all the controllers, to all the actions inside a controller, or to a specific action. Filters act like a middleware that happens after the MVC routing was resolved. With them you can execute code before and after an action is called.
Suppose you want to filter requests that need to be authenticated, and not allow unauthenticated users to execute certain actions or controllers:

```typescript
@Injectable({ lifeTime: DependencyLifeTime.Scoped })
export class SecurityFilter implements IFilter {
    constructor(private readonly configurationBuilder: ConfigurationBuilder, private readonly loggedUser: LoggedUser) {}

    beforeExecute(httpContext: HttpContext, routingContext: RoutingContext): void {
        const headerAuth = httpContext.request.headers["x-auth"];
        const configuration = this.configurationBuilder.build(FooConfiguration);

        if (headerAuth === configuration.adminSecret) {
            this.loggedUser.role = Roles.Admin;
            return;
        }

        httpContext.status = 401;
        httpContext.body = "The user is not authenticated.";
    }
}
```

This filter is asking to be executed before the actual action. There is three types of methods you can override in a filter:

-   `beforeExecute`: Executes before any given action.
-   `afterExecute`: Executes after any given action has been executed.
-   `onError`: Executes instead of `afterExecute` in case of an unhandled error.

> You can execute all of them as sync or async methods as well. The type of return can be `void` or `Promise<void>`.

And before anything happens, the filter looks for a special request header, and evaluates if the header value is equal to a given client secret. If it is, sets up the logged user role, and if it's not, finishes the request and return a 401. By setting the status and sending a response, we are closing the context, and mvc routing will not execute any more filters or actions. Instead of checking a client secret, you could look inside a database, or check with third party o-auth service, the subjacent idea is the same.

> **Important Note**: Since v1.2.0 there's a method called `ApiRouter.ignoreClosedResponseOnFilters()` that can be invoked from your server class by calling `this.routing.ignoreClosedResponseOnFilters()` that will change the default behavior, and execute filter events even if the HttpContext has been closed. This can be helpful if you need to execute an action even if the response has been finished, like release a connection object to the connection bool. If you need to do something like this, we recommend to also override the `onError` method in case the request fails, because in case of failure the afterExecute won't be executed.

Now, how can we configure this filter on a real case scenario? let's take the `ProductController` example, and see how we can configure. In our first scenario, let's suppose that our product catalog is available to everyone, but only collaborators can add, modify or remove products from the catalog. In that case, we need to block only some actions:

```typescript
@Controller({ route: "api/product" })
export class ProductController {
    constructor(private readonly productService: ProductService) {}

    @Action({ route: "single/:id" })
    async get(id: number): Promise<Product> {
        return await this.productService.get(id);
    }

    @Action({ route: "all", method: HttpMethod.GET })
    async getAll(): Promise<Product[]> {
        return await this.productService.getAll();
    }

    @Action({ fromBody: true, filters: [SecurityFilter] })
    async post(product: Product): Promise<void> {
        await this.productService.save(product);
    }

    @Action({ route: ":id", filters: [SecurityFilter] })
    async delete(id: number): Promise<void> {
        await this.productService.delete(id);
    }
}
```

Take a look to the `post` and `delete` actions. We added the `filters: [ SecurityFilter ]` parameter, and inside it, we included our filter. By doing so, we are effectively telling the router to execute the filter for that particular action. You may have noticed that filters is an array, you can setup multiple filters per action.

Now lets say on our second case scenario, our product catalog is part of an ERP type system, and it's only accessible to logged users and not guests. In that case, adding the filter to every action is tedious. But trouble not, there is an easier way:

```typescript
@Controller({ route: "api/product", filters: [SecurityFilter] })
export class ProductController {
    constructor(private readonly productService: ProductService) {}

    @Action({ route: "single/:id" })
    async get(id: number): Promise<Product> {
        return await this.productService.get(id);
    }

    @Action({ route: "all", method: HttpMethod.GET })
    async getAll(): Promise<Product[]> {
        return await this.productService.getAll();
    }

    @Action({ fromBody: true })
    async post(product: Product): Promise<void> {
        await this.productService.save(product);
    }

    @Action({ route: ":id" })
    async delete(id: number): Promise<void> {
        await this.productService.delete(id);
    }
}
```

We removed the filters from the `post` and `delete` methods, but we added it to the controller. If you look the `@Controller(...)` decorator, you'll find the same filters array as with the action. The functionality is exactly the same, only that the filter will be executed for all the actions inside `ProductController`.

Suppose that now you want to log every request to your controllers, at least the ones that resolved to a valid action. Decorating every controller is as tedious as decorating every action, and in programming, boring stuff tend to be error prone. As you may have already thought, there is another higher level place you can configure a filter, that will apply to all the controllers. First, let's code our filter:

```typescript
@Injectable()
export class LogFilter implements IFilter {
    constructor(private readonly logger: Logger) {}

    beforeExecute(httpContext: HttpContext, routingContext: RoutingContext): void {
        this.logger.trace(`${httpContext.request.method} request to ${httpContext.request.url} directed to ${routingContext}`);
    }
}
```

Now, we can configure it as a global filter in our `ApiServer`:

```typescript
export class FooServer extends ApiServer
{
    protected configureApplication(): void
    {
        ...

        this.routing.registerGlobalFilter(LogFilter);
    }
}
```

There are two methods you can call on your server class:

-   `this.routing.registerGlobalFilter(MyFilter)`: Allows to register only one filter at a time.
-   `this.routing.registerGlobalFilters([Filter1, Filter2])`: Takes an array of filters to be register.

Another minor thing to mention, is that the framework resolves filters using DI. This means you need to decorate or register your filter in the same `DependencyContainer` that your server uses. If you don't call 'HostBuilder.useDependencyInjection(() => ...)' then your filters will be registered inside 'DependencyCollection.globalCollection'. Filters will be resolved inside a scoped container used for each request, so you could make a filter scoped, or transient, depending on your needs.

Last but not least, is good to understand the order in which the filters are executed, mostly if you end up having the 3 categories at the same time:

1. `before` execute: `global` filter
2. `before` execute: `controller` filter
3. `before` execute: `action` filter
4. the action is executed.
5. `after` execute: `action` filter
6. `after` execute: `controller` filter
7. `after` execute: `global` filter:

The order reversion not only affects these categories, but also filters inside each step. If you have two filters in the global scope, these will be executed in order first, and then in reverse order: I.E.:

1. Global (before execute): Filter1
2. Global (before execute): Filter2
3. Global (after execute): Filter2
4. Global (after execute): Filter1

## Version History

### 1.0.0

Uploaded solution with all the tests.

## Building and Testing

To build the library:

```shell
$ npm run build
```

To watch-build the library:

```shell
$ npm run watch
```

To test the solution:

```shell
$ npm run test
```

To watch-test the solution:

```shell
$ npm run watch-test
```

To see the test coverage:

```shell
$ npm run coverage
```

To watch-coverage the solution:

```shell
$ npm run watch-coverage
```

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

### ConfigurationBuilder

The configuration builder will now catch the configuration in memory unless the user tells otherwise. There's a new argument on the `ConfigurationProvider.build(class, cache)` that the user can set to false in case they want to avoid caching. If the `build` method detects that the previously cached configuration and the provided class are different, then it will build a new configuration object.

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
