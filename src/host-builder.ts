import { ConfigurationBuilder } from "./configuration/configuration-builder";
import { Logger } from "./logging/logger";
import { ApiServer } from "./api-server";
import { DependencyCollection, DependencyContainer, ObjectType } from "@miracledevs/paradigm-web-di";

export type ConfigurationMethod = (configurationBuilder: ConfigurationBuilder) => void;

export type LoggingMethod = (logger: Logger) => void;

export type DependencyInjectionMethod = () => DependencyCollection;

export class HostBuilder {
    private _configurationMethod?: ConfigurationMethod;

    private _loggingMethod?: LoggingMethod;

    private _injectorMethod?: DependencyInjectionMethod;

    useConfiguration(configurationMethod: ConfigurationMethod): HostBuilder {
        this._configurationMethod = configurationMethod;
        return this;
    }

    useLogging(loggingMethod: LoggingMethod): HostBuilder {
        this._loggingMethod = loggingMethod;
        return this;
    }

    useDependencyInjection(injectorMethod: DependencyInjectionMethod): HostBuilder {
        this._injectorMethod = injectorMethod;
        return this;
    }

    build<TServer extends ApiServer>(serverClass: ObjectType<TServer>): TServer {
        const configurationBuilder = new ConfigurationBuilder();
        const logger = new Logger();

        let collection: DependencyCollection | undefined = undefined;

        if (this._configurationMethod) this._configurationMethod(configurationBuilder);

        if (this._loggingMethod) this._loggingMethod(logger);

        if (this._injectorMethod) collection = this._injectorMethod();

        collection = collection ?? DependencyCollection.globalCollection;
        collection.registerSingleton(ConfigurationBuilder, [], configurationBuilder);
        collection.registerSingleton(Logger, [], logger);
        collection.registerSingleton(serverClass, [ConfigurationBuilder, DependencyContainer as any, Logger]);

        const container = collection.buildContainer(true);
        return container.resolve(serverClass);
    }
}
