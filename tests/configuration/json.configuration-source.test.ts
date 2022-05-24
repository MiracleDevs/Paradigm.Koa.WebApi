import { JsonConfigurationSource } from "../../src/configuration/json.configuration-source";

describe("JSON Configuration Source", () => {
    it("should instantiate a json configuration source", () => expect(new JsonConfigurationSource("./config.json")).not.toBeNull());

    it("should open the configuration from a json file", async () => {
        const jsonConfigurationSource = new JsonConfigurationSource("./tests/configuration/config.json");
        const object = await jsonConfigurationSource.get();

        expect(object).not.toBeNull();
        expect(object.value).toBe("Json object");

        expect(object.complexObject).not.toBeNull();
        expect(object.complexObject.value).toBe("Complex json object value");

        expect(object.complexArray).not.toBeNull();
        expect(object.complexArray).toHaveLength(2);
        expect(object.complexArray[0]).toBe("First json array value");
        expect(object.complexArray[1]).toBe("Second json array value");
    });

    it("should fail if file does not exist", async () => {
        let jsonConfigurationSource = new JsonConfigurationSource("./tests/configuration/non-existing-config.json");
        await expect(async () => await jsonConfigurationSource.get()).rejects.toThrow();

        jsonConfigurationSource = new JsonConfigurationSource(undefined as any);
        await expect(async () => await jsonConfigurationSource.get()).rejects.toThrow();
    });
});
