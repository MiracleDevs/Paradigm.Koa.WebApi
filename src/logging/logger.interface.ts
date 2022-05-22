import { LogType } from "./log-type";
import { ILogProvider } from "./log-provider.interface";

export interface ILogger {
    setMinimumLevel(type: LogType): void;
    setLogProvider(logProvider: ILogProvider): void;
    setMessageFormat(format: string): void;
    trace(message: string): void;
    debug(message: string): void;
    info(message: string): void;
    warning(message: string): void;
    error(message: string): void;
    log(message: string, type: LogType): void;
}
