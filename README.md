[![Paradigm Koa WebApi](https://github.com/MiracleDevs/Paradigm.Koa.WebApi/actions/workflows/build-and-test.yml/badge.svg?branch=main)](https://github.com/MiracleDevs/Paradigm.Koa.WebApi/actions/workflows/build-and-test.yml)

# Paradigm.Koa.WebApi

A port of Paradigm.Express.WebApi to use koa as the internal server and router. The objective is still provide a clear architecture and patterns to work on webapis, allowing async methods, clear server-agnostic interfaces for controller and services, and include filters, which not only include the http context, but the routing context, with metadata about controllers and actions.

## Package Configuration

This Solution is configured to use Prettier, eslint and to format the source code before commit after a stage operation. The CI scripts also checks format when running the actions.
