import { HostBuilder } from "../src/host-builder";
import { ApiServer } from "../src/api-server";
import { DependencyCollection } from "@miracledevs/paradigm-web-di";

describe("Host Builder", () => {
    class Server extends ApiServer {
        verify(): void {
            expect(this.configurationBuilder).not.toBeNull();
            expect(this.dependencyContainer).not.toBeNull();
            expect(this.logger).not.toBeNull();
        }
    }

    it("should instantiate the host builder", () => expect(() => new HostBuilder()).not.toBeNull());

    it("should allow to use dependency collection", () => {
        const hostBuilder = new HostBuilder();
        let called = false;

        hostBuilder.useDependencyInjection(() => {
            called = true;
            return new DependencyCollection();
        });

        hostBuilder.build(Server);
        expect(called).toBeTruthy();
    });

    it("should build server", () => {
        const hostBuilder = new HostBuilder();
        const server = hostBuilder.build(Server);
        expect(server).not.toBeNull();
        server.verify();
    });

    it("should use logging", () => {
        const hostBuilder = new HostBuilder().useDependencyInjection(() => new DependencyCollection());
        let called = false;

        hostBuilder.useLogging(l => {
            expect(l).not.toBeNull();
            called = true;
        });

        hostBuilder.build(Server);
        expect(called).toBeTruthy();
    });

    it("should use configuration", () => {
        const hostBuilder = new HostBuilder().useDependencyInjection(() => new DependencyCollection());
        let called = false;

        hostBuilder.useConfiguration(c => {
            expect(c).not.toBeNull();
            called = true;
        });

        hostBuilder.build(Server);
        expect(called).toBeTruthy();
    });
});
