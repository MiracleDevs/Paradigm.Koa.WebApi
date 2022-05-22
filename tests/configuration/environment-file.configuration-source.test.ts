import { EnvironmentFileConfigurationSource } from "../../src/configuration/environment-file.configuration-source";

describe("Environment File Configuration Source", () => {
    function clearEnvironment(): void {
        delete process.env.paradigm_test__value;
        delete process.env.paradigm_test__complexObject__value;
        delete process.env.paradigm_test__complexArray__0;
        delete process.env.paradigm_test__complexArray__1;
        delete process.env.value;
        delete process.env.complexObject__value;
        delete process.env.complexArray__0;
        delete process.env.complexArray__1;
    }

    it("should instantiate an environment file configuration source", () => expect(new EnvironmentFileConfigurationSource("./config.env", "paradigm_test__")).not.toBeNull());

    it("should open the configuration from an .env file with a prefix", async () => {
        clearEnvironment();
        const configurationSource = new EnvironmentFileConfigurationSource("./tests/configuration/config.prefixed.env", "paradigm_test__");
        const object = await configurationSource.get();

        expect(object).not.toBeNull();
        expect(object.value).toBe("Env object");

        expect(object.complexObject).not.toBeNull();
        expect(object.complexObject.value).toBe("Complex env object value");

        expect(object.complexArray).not.toBeNull();
        expect(object.complexArray).toHaveLength(2);
        expect(object.complexArray[0]).toBe("First env array value");
        expect(object.complexArray[1]).toBe("Second env array value");
    });

    it("should open the configuration from an .env file without a prefix", async () => {
        clearEnvironment();
        const configurationSource = new EnvironmentFileConfigurationSource("./tests/configuration/config.unprefixed.env");
        const object = await configurationSource.get();

        expect(object).not.toBeNull();
        expect(object.value).toBe("Env object");

        expect(object.complexObject).not.toBeNull();
        expect(object.complexObject.value).toBe("Complex env object value");

        expect(object.complexArray).not.toBeNull();
        expect(object.complexArray).toHaveLength(2);
        expect(object.complexArray[0]).toBe("First env array value");
        expect(object.complexArray[1]).toBe("Second env array value");
    });
});
