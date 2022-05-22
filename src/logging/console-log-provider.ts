import { ILogProvider } from "./log-provider.interface";

const FgRed = "\x1b[31m";
const FgGreen = "\x1b[32m";
const FgYellow = "\x1b[33m";
const FgMagenta = "\x1b[35m";
const FgWhite = "\x1b[37m";

export class ConsoleLogProvider implements ILogProvider {
    trace(message: string): void {
        console.log(`${FgMagenta} ${message}`);
    }

    debug(message: string): void {
        console.debug(`${FgWhite} ${message}`);
    }

    info(message: string): void {
        console.info(`${FgGreen} ${message}`);
    }

    warning(message: string): void {
        console.warn(`${FgYellow} ${message}`);
    }

    error(message: string): void {
        console.error(`${FgRed} ${message}`);
    }
}
