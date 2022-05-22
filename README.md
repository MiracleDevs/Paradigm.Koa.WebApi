[![Paradigm Koa WebApi](https://github.com/MiracleDevs/Paradigm.Koa.WebApi/actions/workflows/build-and-test.yml/badge.svg?branch=main)](https://github.com/MiracleDevs/Paradigm.Koa.WebApi/actions/workflows/build-and-test.yml)

# Paradigm.Koa.WebApi <!-- omit in toc -->

A port of [Paradigm.Express.WebApi](https://github.com/MiracleDevs/Paradigm.Express.Web.Api) to use koa as the internal server and router. The objective is still provide a clear architecture and patterns to work on webapis, allowing async methods, clear server-agnostic interfaces for controller and services, and include filters, which not only include the http context, but the routing context, with metadata about controllers and actions.

## Table of Contents <!-- omit in toc -->

-   [Package Configuration](#package-configuration)
-   [Migrating from Paradigm.Express.WebApi](#migrating-from-paradigmexpresswebapi)
    -   [HttpContext](#httpcontext)
    -   [Request and Response](#request-and-response)
    -   [Controllers](#controllers)

## Package Configuration

This Solution is configured to use Prettier, eslint and to format the source code before commit after a stage operation. The CI scripts also checks format when running the actions.

## Migrating from Paradigm.Express.WebApi

This framework is based on [Paradigm.Express.WebApi](https://github.com/MiracleDevs/Paradigm.Express.Web.Api) but there are some important changes and departures from the Express version. We'll try to list all the differences:

### HttpContext

This version utilizes Koa Context as a replacement of our HttpContext class. There's no need to have our own context any more. But for naming sake, we are still exporting Koa.Context as HttpContext, to differentiate from the RoutingContext. The interface of the object differs slightly, the property finished does not exist any more.

### Request and Response

The request and response objects are now Koa objects, and some of the properties and methods are different. Most notably response can't be finished, filters can overwrite the response body, and there's now off-the-shelf solution to track. You can check if the body posses values or not, or if the status has been set or not.

> **Important**: Response can not be finished, and all filters will ran, there's no more avoid filters when response is finished. So you'll need to verify manually.

### Controllers

In previous versions, controller classes needed to extend the `ApiController` class. `ApiController` class was removed and now controllers can be standalone classes without constraints on the framework side.

> **Important** The ApiController base class provided a reference to the HttpContext class. In this new framework you can access the `HttpContext` and `RoutingContext` by adding them to your action as the last two arguments of your method:
>
> ```ts
> @Action({ route: 'myaction/:arg1/:arg2' })
> myAction(arg1: number, arg2: string, httpContext: HttpContext, routingContext: RoutingContext): Promise<void>
> {
> }
> ```
>
> You can ignore these two parameters if you don't need them.
