import { ConsoleLogProvider } from "../../src/logging/console-log-provider";
import { InMemoryLogProvider } from "../../src/logging/in-memory-log-provider";

describe("Console Log Provider", () => {
    it("should instantiate the console log provider", () => expect(new ConsoleLogProvider()).not.toBeNull());

    it("should trace a message", () =>
        expect(() => {
            const consoleProvider = new InMemoryLogProvider();
            consoleProvider.trace("trace message");
            expect(consoleProvider.getMessages()[0]).toBe("trace message");
        }).not.toThrowError());

    it("should debug a message", () =>
        expect(() => {
            const consoleProvider = new InMemoryLogProvider();
            consoleProvider.debug("debug message");
            expect(consoleProvider.getMessages()[0]).toBe("debug message");
        }).not.toThrowError());

    it("should inform a message", () =>
        expect(() => {
            const consoleProvider = new InMemoryLogProvider();
            consoleProvider.info("info message");
            expect(consoleProvider.getMessages()[0]).toBe("info message");
        }).not.toThrowError());

    it("should warn a message", () =>
        expect(() => {
            const consoleProvider = new InMemoryLogProvider();
            consoleProvider.warning("warn message");
            expect(consoleProvider.getMessages()[0]).toBe("warn message");
        }).not.toThrowError());

    it("should error a message", () =>
        expect(() => {
            const consoleProvider = new InMemoryLogProvider();
            consoleProvider.error("error message");
            expect(consoleProvider.getMessages()[0]).toBe("error message");
        }).not.toThrowError());

    it("should set a limit", () => {
        const consoleProvider = new InMemoryLogProvider(3);
        consoleProvider.error("1");
        consoleProvider.error("2");
        consoleProvider.error("3");
        consoleProvider.error("4");
        expect(consoleProvider.getMessages().length).toBe(3);
        expect(consoleProvider.getMessages()[0]).toBe("2");
        expect(consoleProvider.getMessages()[1]).toBe("3");
        expect(consoleProvider.getMessages()[2]).toBe("4");
    });
});
