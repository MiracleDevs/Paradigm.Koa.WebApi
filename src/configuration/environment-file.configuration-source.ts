import { EnvironmentVariableConfigurationSource } from "./environment-variable.configuration-source";
import dotenv from "dotenv";

export class EnvironmentFileConfigurationSource extends EnvironmentVariableConfigurationSource {
    constructor(private readonly filePath: string, settingsPrefix?: string) {
        super(settingsPrefix);
        dotenv.config({ path: this.filePath });
    }
}
