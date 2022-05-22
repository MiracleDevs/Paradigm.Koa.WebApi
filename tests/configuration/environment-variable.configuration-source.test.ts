import { EnvironmentVariableConfigurationSource } from "../../src/configuration/environment-variable.configuration-source";

describe("Environment Variable Configuration Source", () => {
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

    it("should instantiate an environment variable configuration source", () => expect(new EnvironmentVariableConfigurationSource()).not.toBeNull());

    it("should open the configuration from prefixed environment variables", async () => {
        clearEnvironment();
        process.env.paradigm_test__value = "Env object";
        process.env.paradigm_test__complexObject__value = "Complex env object value";
        process.env.paradigm_test__complexArray__0 = "First env array value";
        process.env.paradigm_test__complexArray__1 = "Second env array value";

        const configurationSource = new EnvironmentVariableConfigurationSource("paradigm_test__");
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

    it("should open the configuration from unprefixed environment variables", async () => {
        clearEnvironment();
        process.env.value = "Env object";
        process.env.complexObject__value = "Complex env object value";
        process.env.complexArray__0 = "First env array value";
        process.env.complexArray__1 = "Second env array value";

        const configurationSource = new EnvironmentVariableConfigurationSource();
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
