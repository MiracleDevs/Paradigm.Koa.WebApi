import { ConsoleLogProvider } from "../../src/logging/console-log-provider";

describe("Console Log Provider", () => {
    it("should instantiate the console log provider", () => expect(new ConsoleLogProvider()).not.toBeNull());

    it("should trace a message", () => expect(() => new ConsoleLogProvider().trace("trace message")).not.toThrowError());

    it("should debug a message", () => expect(() => new ConsoleLogProvider().debug("debug message")).not.toThrowError());

    it("should inform a message", () => expect(() => new ConsoleLogProvider().info("info message")).not.toThrowError());

    it("should warn a message", () => expect(() => new ConsoleLogProvider().warning("warning message")).not.toThrowError());

    it("should error a message", () => expect(() => new ConsoleLogProvider().error("error message")).not.toThrowError());
});
