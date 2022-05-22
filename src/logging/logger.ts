import { ILogger } from "./logger.interface";
import { LogType } from "./log-type";
import { ILogProvider } from "./log-provider.interface";
import { ConsoleLogProvider } from "./console-log-provider";

export class Logger implements ILogger {
    private _minimumLogLevel: LogType = LogType.Info;

    private _logProvider: ILogProvider = new ConsoleLogProvider();

    private _messageFormat: string = "[{date}][{type}] - {message}";

    setMinimumLevel(type: LogType): void {
        this._minimumLogLevel = type;
    }

    setLogProvider(logProvider: ILogProvider): void {
        this._logProvider = logProvider;
    }

    setMessageFormat(messageFormat: string): void {
        this._messageFormat = messageFormat;
    }

    trace(message: string): void {
        this.log(message, LogType.Trace);
    }

    debug(message: string): void {
        this.log(message, LogType.Debug);
    }

    info(message: string): void {
        this.log(message, LogType.Info);
    }

    warning(message: string): void {
        this.log(message, LogType.Warning);
    }

    error(message: string): void {
        this.log(message, LogType.Error);
    }

    log(message: string, type: LogType): void {
        if (type < this._minimumLogLevel) {
            return;
        }

        message = this._messageFormat
            .replace(/\{date\}/g, new Date().toJSON())
            .replace(/\{type\}/g, LogType[type])
            .replace(/\{message\}/g, message);

        switch (type) {
            case LogType.Trace:
                this._logProvider.trace(message);
                break;

            case LogType.Debug:
                this._logProvider.debug(message);
                break;

            case LogType.Info:
                this._logProvider.info(message);
                break;

            case LogType.Warning:
                this._logProvider.warning(message);
                break;

            case LogType.Error:
                this._logProvider.error(message);
                break;

            default:
                throw new Error("The log type is not valid.");
        }
    }
}
