import { ApiServer } from "../src/api-server";
import { Logger } from "../src/logging/logger";
import { ConfigurationBuilder } from "../src/configuration/configuration-builder";
import { DependencyCollection } from "@miracledevs/paradigm-web-di";
import { InMemoryLogProvider } from "../src/logging/in-memory-log-provider";

describe("Api Server", () => {
    class Controller1 {}

    class Controller2 {}

    class Controller3 {}

    class Server extends ApiServer {
        configured: boolean = false;

        constructor() {
            super(new ConfigurationBuilder(), DependencyCollection.globalCollection.buildContainer(), new Logger());
        }

        protected configureApplication(): void {
            this.logger.setLogProvider(new InMemoryLogProvider());
            expect(() => this.registerController(Controller1)).not.toThrowError();
            expect(() => this.registerControllers([Controller2, Controller3])).not.toThrowError();
            expect(this.controllers).toHaveLength(3);
            this.configured = true;
        }
    }

    it("should instantiate the api server", () => expect(new Server()).not.toBeNull());

    it("should start and stop the server", async () => {
        const server = new Server();
        expect(() => server.start()).not.toThrowError();
        expect(server.configured).toBeTruthy();
        expect(server.koaApplication).not.toBeNull();
        expect(server.httpServer).not.toBeNull();
        expect(server.routing).not.toBeNull();
        await expect(async () => await server.stop()).not.toThrowError();
    });

    it("should fail if try to access server before starting", () => {
        const server = new Server();
        expect(() => server.httpServer).toThrowError("The server is not running. Please call start first.");
    });
});
