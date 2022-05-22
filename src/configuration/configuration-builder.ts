import { IConfigurationSource } from "./configuration-source.interface";
import { JsonConfigurationSource } from "./json.configuration-source";
import { EnvironmentVariableConfigurationSource } from "./environment-variable.configuration-source";
import { EnvironmentFileConfigurationSource } from "./environment-file.configuration-source";

const defaultConfigurationFileName = "appsettings.json";

export class ConfigurationBuilder {
    private readonly _sources: IConfigurationSource[];
    private cachedConfiguration?: any;

    constructor() {
        this._sources = [];
    }

    addJsonFile(filePath?: string): ConfigurationBuilder {
        this._sources.push(new JsonConfigurationSource(filePath ?? defaultConfigurationFileName));
        return this;
    }

    addEnvironmentVariables(settingsPrefix?: string): ConfigurationBuilder {
        this._sources.push(new EnvironmentVariableConfigurationSource(settingsPrefix));
        return this;
    }

    addEnvironmentFile(filePath: string, settingsPrefix?: string): ConfigurationBuilder {
        this._sources.push(new EnvironmentFileConfigurationSource(filePath, settingsPrefix));
        return this;
    }

    async build<TConfiguration>(configurationClass: { new (): TConfiguration }, cache: boolean = true): Promise<TConfiguration> {
        if (cache && this.cachedConfiguration && configurationClass === this.cachedConfiguration.constructor) return this.cachedConfiguration;

        const configuration = new configurationClass();

        for (const cfgSource of this._sources) {
            Object.assign(configuration, await cfgSource.get());
        }

        this.cachedConfiguration = configuration;
        return this.cachedConfiguration;
    }
}
