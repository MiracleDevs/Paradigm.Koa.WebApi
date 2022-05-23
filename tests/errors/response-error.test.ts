import { ApiServer } from "../../src/api-server";
import { Logger } from "../../src/logging/logger";
import { ConfigurationBuilder } from "../../src/configuration/configuration-builder";
import { DependencyCollection, Injectable } from "@miracledevs/paradigm-web-di";
import { ResponseError } from "../../src/Errors/response-error";
import { IFilter } from "../../src/filters/filter.interface";
import { HttpContext } from "../../src/shared/http-context";
import { Controller } from "../../src/decorators/controller";
import { Action } from "../../src/decorators/action";
import supertest from "supertest";

describe("Api Server", () => {
    class AuthenticationError extends ResponseError {
        constructor() {
            super(401, "The user is not authenticated");
        }
    }

    class MissingTokenError extends ResponseError {
        constructor() {
            super(400, "The user did not provide an authentication token");
        }
    }

    const clientSecret = "test_client_secret";

    @Injectable()
    class AuthenticationFilter implements IFilter {
        beforeExecute(httpContext: HttpContext): void {
            const token = httpContext.request.headers["x-auth"];
            if (!token) throw new MissingTokenError();
            if (token !== clientSecret) throw new AuthenticationError();
        }
    }

    @Controller({ route: "api/test" })
    class TestController {
        @Action()
        get(): string {
            return "Method was executed";
        }
    }

    class Server extends ApiServer {
        constructor() {
            super(new ConfigurationBuilder(), DependencyCollection.globalCollection.buildContainer(), new Logger());
        }

        protected configureApplication(): void {
            super.configureApplication();
            this.registerController(TestController);
            this.routing.registerGlobalFilter(AuthenticationFilter);
        }
    }

    it("should instantiate the response error", () => expect(new ResponseError(400, "Bad request")).not.toBeNull());

    it("should throw a valid error if user does not provide token", async () => {
        const server = new Server();
        server.start();
        const request = supertest(server.httpServer);
        const response = await request.get("/api/test");
        expect(response.status).toBe(400);
        expect(response.text).toBe("The user did not provide an authentication token");
        await server.stop();
    });

    it("should throw a valid error if user provides a bad token", async () => {
        const server = new Server();
        server.start();
        const request = supertest(server.httpServer);
        const response = await request.get("/api/test").set("x-auth", "incorrect token");
        expect(response.status).toBe(401);
        expect(response.text).toBe("The user is not authenticated");
        await server.stop();
    });
});
