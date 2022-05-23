import { IFilter } from "../src/filters/filter.interface";
import { HttpContext } from "../src/shared/http-context";
import { DependencyCollection, DependencyLifeTime, Injectable } from "@miracledevs/paradigm-web-di";
import { Controller } from "../src/decorators/controller";
import { Action } from "../src/decorators/action";
import { RoutingContext } from "../src/shared/routing-context";
import { Logger } from "../src/logging/logger";
import supertest from "supertest";
import { ApiServer } from "../src/api-server";
import { ConfigurationBuilder } from "../src/configuration/configuration-builder";

describe("Filters", () => {
    ////////////////////////////////////////////////////////////////
    // Filters
    ////////////////////////////////////////////////////////////////
    @Injectable()
    class OnlyBeforeFilter implements IFilter {
        static called: boolean;

        static reset(): void {
            OnlyBeforeFilter.called = false;
        }

        beforeExecute(httpContext: HttpContext, routingContext: RoutingContext): void {
            expect(httpContext).not.toBeNull();
            expect(httpContext.request).not.toBeNull();
            expect(httpContext.response).not.toBeNull();

            expect(routingContext).not.toBeNull();
            expect(routingContext.controllerType).not.toBeNull();
            expect(routingContext.actionType).not.toBeNull();

            OnlyBeforeFilter.called = true;
        }
    }

    @Injectable()
    class OnlyAfterFilter implements IFilter {
        static called: boolean;

        static reset(): void {
            OnlyAfterFilter.called = false;
        }

        afterExecute(httpContext: HttpContext, routingContext: RoutingContext): void {
            expect(httpContext).not.toBeNull();
            expect(httpContext.request).not.toBeNull();
            expect(httpContext.response).not.toBeNull();

            expect(routingContext).not.toBeNull();
            expect(routingContext.controllerType).not.toBeNull();
            expect(routingContext.actionType).not.toBeNull();

            OnlyAfterFilter.called = true;
        }
    }

    @Injectable({ lifeTime: DependencyLifeTime.Singleton })
    class LogGlobalFilter implements IFilter {
        executedBefore: boolean = false;

        executedAfter: boolean = false;

        executedError: boolean = false;

        beforeExecute(): void {
            this.executedBefore = true;
        }

        afterExecute(): void {
            this.executedAfter = true;
        }

        onError(): void {
            this.executedError = true;
        }

        clean(): void {
            this.executedBefore = false;
            this.executedAfter = false;
            this.executedError = false;
        }
    }

    @Injectable({ lifeTime: DependencyLifeTime.Singleton })
    class LogControllerFilter extends LogGlobalFilter {}

    @Injectable({ lifeTime: DependencyLifeTime.Singleton })
    class LogActionFilter extends LogGlobalFilter {}

    @Injectable()
    class ThrowBeforeFilter implements IFilter {
        beforeExecute(httpContext: HttpContext, routingContext: RoutingContext): void {
            throw new Error("throw on before");
        }
    }

    @Injectable()
    class ThrowAfterFilter implements IFilter {
        afterExecute(httpContext: HttpContext, routingContext: RoutingContext): void {
            throw new Error("throw on after");
        }
    }

    class ExecutionOrder {
        public static order: number[] = [];
        public static index: number = 1;
    }

    @Injectable({ lifeTime: DependencyLifeTime.Singleton })
    class CounterGlobalFilter {
        beforeExecute(): void {
            ExecutionOrder.order.push(ExecutionOrder.index++);
        }

        afterExecute(): void {
            ExecutionOrder.order.push(--ExecutionOrder.index);
        }
    }

    @Injectable({ lifeTime: DependencyLifeTime.Singleton })
    class CounterControllerFilter extends CounterGlobalFilter {}

    @Injectable({ lifeTime: DependencyLifeTime.Singleton })
    class CounterActionFilter extends CounterGlobalFilter {}

    @Injectable({ lifeTime: DependencyLifeTime.Singleton })
    class SecondCounterActionFilter extends CounterGlobalFilter {}

    class NotDecoratedFilter implements IFilter {
        beforeExecute(): void {
            throw Error("Shouldn't execute");
        }
    }

    ////////////////////////////////////////////////////////////////
    // Controllers
    ////////////////////////////////////////////////////////////////
    @Controller({ route: "before-filter", filters: [OnlyBeforeFilter] })
    class BeforeFilterController {
        @Action({ filters: [OnlyBeforeFilter] })
        get(): void {}
    }

    @Controller({ route: "after-filter", filters: [OnlyAfterFilter] })
    class AfterFilterController {
        @Action({ filters: [OnlyAfterFilter] })
        get(): void {}
    }

    @Controller({ route: "throw-on-before-global-filter", filters: [LogControllerFilter] })
    class ThrowOnBeforeGlobalController {
        @Action({ filters: [LogActionFilter] })
        get(): void {}
    }

    @Controller({ route: "throw-on-before-controller-filter", filters: [ThrowBeforeFilter, LogControllerFilter] })
    class ThrowOnBeforeControllerController {
        @Action({ filters: [LogActionFilter] })
        get(): void {}
    }

    @Controller({ route: "throw-on-before-action-filter", filters: [LogControllerFilter] })
    class ThrowOnBeforeActionController {
        @Action({ filters: [ThrowBeforeFilter, LogActionFilter] })
        get(): void {}
    }

    @Controller({ route: "throw-on-action-filter", filters: [LogControllerFilter] })
    class ThrowOnActionController {
        @Action({ filters: [LogActionFilter] })
        get(): void {
            throw new Error("throw on action");
        }
    }

    @Controller({ route: "throw-on-after-action-filter", filters: [LogControllerFilter] })
    class ThrowOnAfterActionController {
        @Action({ filters: [LogActionFilter, ThrowAfterFilter] })
        get(): void {}
    }

    @Controller({ route: "throw-on-after-controller-filter", filters: [LogControllerFilter, ThrowAfterFilter] })
    class ThrowOnAfterControllerController {
        @Action({ filters: [LogActionFilter] })
        get(): void {}
    }

    @Controller({ route: "throw-on-after-global-filter", filters: [LogControllerFilter] })
    class ThrowOnAfterGlobalController {
        @Action({ filters: [LogActionFilter] })
        get(): void {}
    }

    @Controller({ route: "respect-execution-order", filters: [CounterControllerFilter] })
    class RespectExecutionOrderController {
        @Action({ filters: [CounterActionFilter, SecondCounterActionFilter] })
        get(): void {}
    }

    class MockServer extends ApiServer {
        constructor() {
            super(new ConfigurationBuilder(), DependencyCollection.globalCollection.buildContainer(), new Logger());
        }

        protected override configureApplication(): void {
            this.registerControllers([
                BeforeFilterController,
                AfterFilterController,
                /*BreakBeforeGlobalController,
                BreakBeforeController,
                BreakBeforeActionController,
                BreakAfterGlobalController,
                BreakAfterController,
                BreakAfterActionController,
                IgnoreBreakBeforeGlobalController,
                IgnoreBreakBeforeControllerController,
                IgnoreBreakBeforeActionController,
                IgnoreBreakOnActionController,
                IgnoreBreakOnAfterActionController,
                IgnoreBreakOnAfterControllerController,*/
                ThrowOnBeforeGlobalController,
                ThrowOnBeforeControllerController,
                ThrowOnBeforeActionController,
                ThrowOnActionController,
                ThrowOnAfterActionController,
                ThrowOnAfterControllerController,
                ThrowOnAfterGlobalController,
                RespectExecutionOrderController,
            ]);
        }
    }

    it("should execute if only before filters are present", async () => {
        OnlyBeforeFilter.reset();
        const server = new MockServer();
        server.start();
        server.routing.registerGlobalFilter(OnlyBeforeFilter);
        const request = supertest(server.httpServer);
        const response = await request.get("/before-filter");
        expect(response.status).toBe(204);
        expect(OnlyBeforeFilter.called).toBe(true);
        await server.stop();
    });

    it("should execute if only after filters are present", async () => {
        OnlyAfterFilter.reset();
        const server = new MockServer();
        server.start();
        server.routing.registerGlobalFilter(OnlyAfterFilter);
        const request = supertest(server.httpServer);
        const response = await request.get("/before-filter");
        expect(response.status).toBe(204);
        expect(OnlyAfterFilter.called).toBe(true);
        await server.stop();
    });

    it("should notify error on the before method on a global filter", async () => {
        const server = new MockServer();

        const injector = server.dependencyContainer;
        injector.resolve(LogGlobalFilter).clean();
        injector.resolve(LogControllerFilter).clean();
        injector.resolve(LogActionFilter).clean();

        server.start();
        server.routing.registerGlobalFilters([ThrowBeforeFilter, LogGlobalFilter]);
        const request = supertest(server.httpServer);
        const response = await request.get("/throw-on-before-global-filter");

        expect(response.status).toBe(500);
        expect(response.text).toBe("throw on before");

        expect(injector.resolve(LogGlobalFilter).executedError).toBe(true);
        expect(injector.resolve(LogControllerFilter).executedError).toBe(true);
        expect(injector.resolve(LogActionFilter).executedError).toBe(true);

        expect(injector.resolve(LogControllerFilter).executedBefore).toBe(false);
        expect(injector.resolve(LogActionFilter).executedBefore).toBe(false);

        expect(injector.resolve(LogActionFilter).executedAfter).toBe(false);
        expect(injector.resolve(LogControllerFilter).executedAfter).toBe(false);
        expect(injector.resolve(LogGlobalFilter).executedAfter).toBe(false);

        await server.stop();
    });

    it("should notify error on the before method on a controller filter", async () => {
        const server = new MockServer();

        const injector = server.dependencyContainer;
        injector.resolve(LogGlobalFilter).clean();
        injector.resolve(LogControllerFilter).clean();
        injector.resolve(LogActionFilter).clean();

        server.start();
        server.routing.registerGlobalFilters([LogGlobalFilter]);
        const request = supertest(server.httpServer);
        const response = await request.get("/throw-on-before-controller-filter");

        expect(response.status).toBe(500);
        expect(response.text).toBe("throw on before");

        expect(injector.resolve(LogGlobalFilter).executedError).toBe(true);
        expect(injector.resolve(LogControllerFilter).executedError).toBe(true);
        expect(injector.resolve(LogActionFilter).executedError).toBe(true);

        expect(injector.resolve(LogGlobalFilter).executedBefore).toBe(true);
        expect(injector.resolve(LogControllerFilter).executedBefore).toBe(false);
        expect(injector.resolve(LogActionFilter).executedBefore).toBe(false);

        expect(injector.resolve(LogActionFilter).executedAfter).toBe(false);
        expect(injector.resolve(LogControllerFilter).executedAfter).toBe(false);
        expect(injector.resolve(LogGlobalFilter).executedAfter).toBe(false);

        await server.stop();
    });

    it("should notify error on the before method on a action filter", async () => {
        const server = new MockServer();

        const injector = server.dependencyContainer;
        injector.resolve(LogGlobalFilter).clean();
        injector.resolve(LogControllerFilter).clean();
        injector.resolve(LogActionFilter).clean();

        server.start();
        server.routing.registerGlobalFilters([LogGlobalFilter]);
        const request = supertest(server.httpServer);
        const response = await request.get("/throw-on-before-action-filter");

        expect(response.status).toBe(500);
        expect(response.text).toBe("throw on before");

        expect(injector.resolve(LogGlobalFilter).executedError).toBe(true);
        expect(injector.resolve(LogControllerFilter).executedError).toBe(true);
        expect(injector.resolve(LogActionFilter).executedError).toBe(true);

        expect(injector.resolve(LogGlobalFilter).executedBefore).toBe(true);
        expect(injector.resolve(LogControllerFilter).executedBefore).toBe(true);
        expect(injector.resolve(LogActionFilter).executedBefore).toBe(false);

        expect(injector.resolve(LogActionFilter).executedAfter).toBe(false);
        expect(injector.resolve(LogControllerFilter).executedAfter).toBe(false);
        expect(injector.resolve(LogGlobalFilter).executedAfter).toBe(false);

        await server.stop();
    });

    it("should notify error on the action", async () => {
        const server = new MockServer();

        const injector = server.dependencyContainer;
        injector.resolve(LogGlobalFilter).clean();
        injector.resolve(LogControllerFilter).clean();
        injector.resolve(LogActionFilter).clean();

        server.start();
        server.routing.registerGlobalFilters([LogGlobalFilter]);
        const request = supertest(server.httpServer);
        const response = await request.get("/throw-on-action-filter");

        expect(response.status).toBe(500);
        expect(response.text).toBe("throw on action");

        expect(injector.resolve(LogGlobalFilter).executedError).toBe(true);
        expect(injector.resolve(LogControllerFilter).executedError).toBe(true);
        expect(injector.resolve(LogActionFilter).executedError).toBe(true);

        expect(injector.resolve(LogGlobalFilter).executedError).toBe(true);
        expect(injector.resolve(LogControllerFilter).executedBefore).toBe(true);
        expect(injector.resolve(LogActionFilter).executedBefore).toBe(true);

        expect(injector.resolve(LogActionFilter).executedAfter).toBe(false);
        expect(injector.resolve(LogControllerFilter).executedAfter).toBe(false);
        expect(injector.resolve(LogGlobalFilter).executedAfter).toBe(false);

        await server.stop();
    });

    it("should notify error on the after method on a action filter", async () => {
        const server = new MockServer();

        const injector = server.dependencyContainer;
        injector.resolve(LogGlobalFilter).clean();
        injector.resolve(LogControllerFilter).clean();
        injector.resolve(LogActionFilter).clean();

        server.start();
        server.routing.registerGlobalFilters([LogGlobalFilter]);
        const request = supertest(server.httpServer);
        const response = await request.get("/throw-on-after-action-filter");

        expect(response.status).toBe(500);
        expect(response.text).toBe("throw on after");

        expect(injector.resolve(LogGlobalFilter).executedError).toBe(true);
        expect(injector.resolve(LogControllerFilter).executedError).toBe(true);
        expect(injector.resolve(LogActionFilter).executedError).toBe(true);

        expect(injector.resolve(LogGlobalFilter).executedBefore).toBe(true);
        expect(injector.resolve(LogControllerFilter).executedBefore).toBe(true);
        expect(injector.resolve(LogActionFilter).executedBefore).toBe(true);

        expect(injector.resolve(LogActionFilter).executedAfter).toBe(false);
        expect(injector.resolve(LogControllerFilter).executedAfter).toBe(false);
        expect(injector.resolve(LogGlobalFilter).executedAfter).toBe(false);

        await server.stop();
    });

    it("should notify error on the after method on a action filter", async () => {
        const server = new MockServer();

        const injector = server.dependencyContainer;
        injector.resolve(LogGlobalFilter).clean();
        injector.resolve(LogControllerFilter).clean();
        injector.resolve(LogActionFilter).clean();

        server.start();
        server.routing.registerGlobalFilters([LogGlobalFilter]);
        const request = supertest(server.httpServer);
        const response = await request.get("/throw-on-after-controller-filter");

        expect(response.status).toBe(500);
        expect(response.text).toBe("throw on after");

        expect(injector.resolve(LogGlobalFilter).executedError).toBe(true);
        expect(injector.resolve(LogControllerFilter).executedError).toBe(true);
        expect(injector.resolve(LogActionFilter).executedError).toBe(true);

        expect(injector.resolve(LogGlobalFilter).executedBefore).toBe(true);
        expect(injector.resolve(LogControllerFilter).executedBefore).toBe(true);
        expect(injector.resolve(LogActionFilter).executedBefore).toBe(true);

        expect(injector.resolve(LogActionFilter).executedAfter).toBe(true);
        expect(injector.resolve(LogControllerFilter).executedAfter).toBe(false);
        expect(injector.resolve(LogGlobalFilter).executedAfter).toBe(false);

        await server.stop();
    });

    it("should notify error on the after method on a action filter", async () => {
        const server = new MockServer();

        const injector = server.dependencyContainer;
        injector.resolve(LogGlobalFilter).clean();
        injector.resolve(LogControllerFilter).clean();
        injector.resolve(LogActionFilter).clean();

        server.start();
        server.routing.registerGlobalFilters([LogGlobalFilter]);
        const request = supertest(server.httpServer);
        const response = await request.get("/throw-on-after-controller-filter");

        expect(response.status).toBe(500);
        expect(response.text).toBe("throw on after");

        expect(injector.resolve(LogGlobalFilter).executedError).toBe(true);
        expect(injector.resolve(LogControllerFilter).executedError).toBe(true);
        expect(injector.resolve(LogActionFilter).executedError).toBe(true);

        expect(injector.resolve(LogGlobalFilter).executedBefore).toBe(true);
        expect(injector.resolve(LogControllerFilter).executedBefore).toBe(true);
        expect(injector.resolve(LogActionFilter).executedBefore).toBe(true);

        expect(injector.resolve(LogActionFilter).executedAfter).toBe(true);
        expect(injector.resolve(LogControllerFilter).executedAfter).toBe(false);
        expect(injector.resolve(LogGlobalFilter).executedAfter).toBe(false);

        await server.stop();
    });

    it("should respect execution order", async () => {
        ExecutionOrder.order = [];
        ExecutionOrder.index = 1;

        const server = new MockServer();
        server.start();
        server.routing.registerGlobalFilters([CounterGlobalFilter]);
        const request = supertest(server.httpServer);
        const response = await request.get("/respect-execution-order");
        expect(ExecutionOrder.order).toEqual([1, 2, 3, 4, 4, 3, 2, 1]);
        expect(ExecutionOrder.index).toBe(1);
        await server.stop();
    });

    it("should fail with a comprehensive message if filter is not decorated for injection", async () => {
        const server = new MockServer();
        server.start();
        server.routing.registerGlobalFilters([NotDecoratedFilter]);
        const request = supertest(server.httpServer);
        const response = await request.get("/respect-execution-order");
        expect(response.status).toBe(500);
        expect(response.text).toBe("Couldn't instantiate the type NotDecoratedFilter.\n - The type NotDecoratedFilter is not registered.");
        await server.stop();
    });
});
