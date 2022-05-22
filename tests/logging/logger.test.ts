import { ILogProvider } from "../../src/logging/log-provider.interface";
import { Logger } from "../../src/logging/logger";
import { LogType } from "../../src/logging/log-type";

describe("Logger", () => {
    class CustomLogProvider implements ILogProvider {
        traceMessage?: string;

        debugMessage?: string;

        infoMessage?: string;

        warningMessage?: string;

        errorMessage?: string;

        trace(message: string): void {
            this.traceMessage = message;
        }

        debug(message: string): void {
            this.debugMessage = message;
        }

        info(message: string): void {
            this.infoMessage = message;
        }

        warning(message: string): void {
            this.warningMessage = message;
        }

        error(message: string): void {
            this.errorMessage = message;
        }
    }

    it("should instantiate the console log provider", () => expect(new Logger()).not.toBeNull());

    it("shouldn't trace a message by default", () => expect(() => new Logger().trace("trace message")).not.toThrowError());

    it("shouldn't debug a message by default", () => expect(() => new Logger().debug("debug message")).not.toThrowError());

    it("should inform a message by default", () => expect(() => new Logger().info("info message")).not.toThrowError());

    it("should warn a message by default", () => expect(() => new Logger().warning("warning message")).not.toThrowError());

    it("should error a message by default", () => expect(() => new Logger().error("error message")).not.toThrowError());

    it("should set a custom log provider", () => {
        const logger = new Logger();
        const provider = new CustomLogProvider();

        expect(() => logger.setLogProvider(provider)).not.toThrowError();
        expect(() => logger.setMinimumLevel(LogType.Trace)).not.toThrowError();
        expect(() => logger.setMessageFormat("{message}")).not.toThrowError();

        logger.trace("custom trace message");
        expect(provider.traceMessage).toBe("custom trace message");
    });

    it("should set a custom message", () => {
        const logger = new Logger();
        const provider = new CustomLogProvider();

        expect(() => logger.setLogProvider(provider)).not.toThrowError();
        expect(() => logger.setMinimumLevel(LogType.Trace)).not.toThrowError();

        expect(() => logger.setMessageFormat("{message}")).not.toThrowError();
        logger.trace("custom trace message");
        expect(provider.traceMessage).toBe("custom trace message");

        expect(() => logger.setMessageFormat("{type} - {message}")).not.toThrowError();
        logger.trace("custom trace message");
        expect(provider.traceMessage).toBe("Trace - custom trace message");

        expect(() => logger.setMessageFormat("{type} - {message} - {date}")).not.toThrowError();
        logger.trace("custom trace message");
        expect(provider.traceMessage?.startsWith("Trace - custom trace message")).toBeTruthy();
    });

    it("should change level to trace", () => {
        const logger = new Logger();
        const provider = new CustomLogProvider();

        expect(() => logger.setLogProvider(provider)).not.toThrowError();
        expect(() => logger.setMinimumLevel(LogType.Trace)).not.toThrowError();
        expect(() => logger.setMessageFormat("{message}")).not.toThrowError();

        logger.trace("trace message");
        logger.debug("debug message");
        logger.info("info message");
        logger.warning("warning message");
        logger.error("error message");

        expect(provider.traceMessage).toBe("trace message");
        expect(provider.debugMessage).toBe("debug message");
        expect(provider.infoMessage).toBe("info message");
        expect(provider.warningMessage).toBe("warning message");
        expect(provider.errorMessage).toBe("error message");
    });

    it("should change level to debug", () => {
        const logger = new Logger();
        const provider = new CustomLogProvider();

        expect(() => logger.setLogProvider(provider)).not.toThrowError();
        expect(() => logger.setMinimumLevel(LogType.Debug)).not.toThrowError();
        expect(() => logger.setMessageFormat("{message}")).not.toThrowError();

        logger.trace("trace message");
        logger.debug("debug message");
        logger.info("info message");
        logger.warning("warning message");
        logger.error("error message");

        expect(provider.traceMessage).toBeUndefined();
        expect(provider.debugMessage).toBe("debug message");
        expect(provider.infoMessage).toBe("info message");
        expect(provider.warningMessage).toBe("warning message");
        expect(provider.errorMessage).toBe("error message");
    });

    it("should change level to info", () => {
        const logger = new Logger();
        const provider = new CustomLogProvider();

        expect(() => logger.setLogProvider(provider)).not.toThrowError();
        expect(() => logger.setMinimumLevel(LogType.Info)).not.toThrowError();
        expect(() => logger.setMessageFormat("{message}")).not.toThrowError();

        logger.trace("trace message");
        logger.debug("debug message");
        logger.info("info message");
        logger.warning("warning message");
        logger.error("error message");

        expect(provider.traceMessage).toBeUndefined();
        expect(provider.debugMessage).toBeUndefined();
        expect(provider.infoMessage).toBe("info message");
        expect(provider.warningMessage).toBe("warning message");
        expect(provider.errorMessage).toBe("error message");
    });

    it("should change level to warning", () => {
        const logger = new Logger();
        const provider = new CustomLogProvider();

        expect(() => logger.setLogProvider(provider)).not.toThrowError();
        expect(() => logger.setMinimumLevel(LogType.Warning)).not.toThrowError();
        expect(() => logger.setMessageFormat("{message}")).not.toThrowError();

        logger.trace("trace message");
        logger.debug("debug message");
        logger.info("info message");
        logger.warning("warning message");
        logger.error("error message");

        expect(provider.traceMessage).toBeUndefined();
        expect(provider.debugMessage).toBeUndefined();
        expect(provider.infoMessage).toBeUndefined();
        expect(provider.warningMessage).toBe("warning message");
        expect(provider.errorMessage).toBe("error message");
    });

    it("should change level to error", () => {
        const logger = new Logger();
        const provider = new CustomLogProvider();

        expect(() => logger.setLogProvider(provider)).not.toThrowError();
        expect(() => logger.setMinimumLevel(LogType.Error)).not.toThrowError();
        expect(() => logger.setMessageFormat("{message}")).not.toThrowError();

        logger.trace("trace message");
        logger.debug("debug message");
        logger.info("info message");
        logger.warning("warning message");
        logger.error("error message");

        expect(provider.traceMessage).toBeUndefined();
        expect(provider.debugMessage).toBeUndefined();
        expect(provider.infoMessage).toBeUndefined();
        expect(provider.warningMessage).toBeUndefined();
        expect(provider.errorMessage).toBe("error message");
    });

    it("shouldn't allow unknown log type", () => expect(() => new Logger().log("message", 20)).toThrowError("The log type is not valid."));
});
