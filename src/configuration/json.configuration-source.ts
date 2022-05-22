import { IConfigurationSource } from "./configuration-source.interface";
import fs from "fs";

export class JsonConfigurationSource implements IConfigurationSource {
    constructor(private readonly filePath: string) {}

    async get(): Promise<any> {
        return new Promise((resolve, reject) => {
            try {
                fs.readFile(this.filePath, (e, rawData) => {
                    if (e) {
                        reject(e);
                    } else {
                        resolve(JSON.parse(rawData.toString()));
                    }
                });
            } catch (e) {
                reject(e);
            }
        });
    }
}
