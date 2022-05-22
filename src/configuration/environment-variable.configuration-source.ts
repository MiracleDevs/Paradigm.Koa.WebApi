import { IConfigurationSource } from "./configuration-source.interface";

const separator = "__";

export class EnvironmentVariableConfigurationSource<T = any> implements IConfigurationSource<T> {
    constructor(protected readonly settingsPrefix?: string) {}

    async get(): Promise<T> {
        const keys = this.settingsPrefix ? Object.keys(process.env).filter(key => key.startsWith(this.settingsPrefix ?? "")) : Object.keys(process.env);

        const target: any = {};

        for (const key of keys) {
            const unprefixedKey = this.settingsPrefix ? key.substr(this.settingsPrefix.length, key.length - this.settingsPrefix.length) : key;
            const parts = unprefixedKey.split(separator);
            let destinationObject = target;
            let i = 0;

            for (i = 0; i < parts.length - 1; i++) {
                const part = parts[i];
                const children = parts[i + 1];
                const isArray = this.isInt(children); // in case the variable targets an array item like 'prefix_object__innerObject__array__0'

                if (!destinationObject[part] && isArray) {
                    destinationObject[part] = [];
                } else if (!destinationObject[part]) {
                    destinationObject[part] = {};
                }

                destinationObject = destinationObject[part];
            }

            destinationObject[parts[i]] = process.env[key];
        }

        return target;
    }

    private isInt(value: string): boolean {
        const intValue = parseInt(value, 10);
        return Number.isInteger(intValue);
    }
}
