import { ILogProvider } from "./log-provider.interface";

export class InMemoryLogProvider implements ILogProvider {
    private readonly _maxMessageCount: number;

    private readonly _messages: string[];

    constructor(maxItemCount: number = 100) {
        this._maxMessageCount = maxItemCount;
        this._messages = [];
    }

    getMessages(): string[] {
        return this._messages;
    }

    trace(message: string): void {
        this._messages.push(message);
        if (this._messages.length > this._maxMessageCount) this._messages.splice(0, 1);
    }

    debug(message: string): void {
        this.trace(message);
    }

    info(message: string): void {
        this.trace(message);
    }

    warning(message: string): void {
        this.trace(message);
    }

    error(message: string): void {
        this.trace(message);
    }
}
