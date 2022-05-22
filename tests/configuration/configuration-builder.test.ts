import { ConfigurationBuilder } from "../../src/configuration/configuration-builder";

describe("Configuration Builder", () => {
    class ComplexObject {
        value?: string;
    }

    class Configuration {
        value?: string;
        complexObject?: ComplexObject;
        complexArray?: string[];
    }

    class SecondConfiguration extends Configuration {}

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

    it("should instantiate a new configuration builder", () => expect(new ConfigurationBuilder()).not.toBeNull());

    it("should add and build from a json file", async () => {
        const builder = new ConfigurationBuilder();
        builder.addJsonFile("./tests/configuration/config.json");
        const object = await builder.build(Configuration);

        expect(object).not.toBeNull();
        expect(object.value).toBe("Json object");

        expect(object.complexObject).not.toBeNull();
        expect(object.complexObject?.value).toBe("Complex json object value");

        expect(object.complexArray).not.toBeNull();
        expect(object.complexArray).toHaveLength(2);
        expect(object.complexArray?.[0]).toBe("First json array value");
        expect(object.complexArray?.[1]).toBe("Second json array value");
    });

    it("should add and build from prefixed environment variables", async () => {
        clearEnvironment();

        process.env.paradigm_test__value = "Env object";
        process.env.paradigm_test__complexObject__value = "Complex env object value";
        process.env.paradigm_test__complexArray__0 = "First env array value";
        process.env.paradigm_test__complexArray__1 = "Second env array value";

        const builder = new ConfigurationBuilder();
        builder.addEnvironmentVariables("paradigm_test__");
        const object = await builder.build(Configuration);

        expect(object).not.toBeNull();
        expect(object.value).toBe("Env object");

        expect(object.complexObject).not.toBeNull();
        expect(object.complexObject?.value).toBe("Complex env object value");

        expect(object.complexArray).not.toBeNull();
        expect(object.complexArray).toHaveLength(2);
        expect(object.complexArray?.[0]).toBe("First env array value");
        expect(object.complexArray?.[1]).toBe("Second env array value");
    });

    it("should add and build from unprefixed environment variables", async () => {
        clearEnvironment();

        process.env.value = "Env object";
        process.env.complexObject__value = "Complex env object value";
        process.env.complexArray__0 = "First env array value";
        process.env.complexArray__1 = "Second env array value";

        const builder = new ConfigurationBuilder();
        builder.addEnvironmentVariables();
        const object = await builder.build(Configuration);

        expect(object).not.toBeNull();
        expect(object.value).toBe("Env object");

        expect(object.complexObject).not.toBeNull();
        expect(object.complexObject?.value).toBe("Complex env object value");

        expect(object.complexArray).not.toBeNull();
        expect(object.complexArray).toHaveLength(2);
        expect(object.complexArray?.[0]).toBe("First env array value");
        expect(object.complexArray?.[1]).toBe("Second env array value");
    });

    it("should add and build from a prefixed environment file", async () => {
        clearEnvironment();

        const builder = new ConfigurationBuilder();
        builder.addEnvironmentFile("./tests/configuration/config.prefixed.env", "paradigm_test__");
        const object = await builder.build(Configuration);

        expect(object).not.toBeNull();
        expect(object.value).toBe("Env object");

        expect(object.complexObject).not.toBeNull();
        expect(object.complexObject?.value).toBe("Complex env object value");

        expect(object.complexArray).not.toBeNull();
        expect(object.complexArray).toHaveLength(2);
        expect(object.complexArray?.[0]).toBe("First env array value");
        expect(object.complexArray?.[1]).toBe("Second env array value");
    });

    it("should add and build from a unprefixed environment file", async () => {
        clearEnvironment();

        const builder = new ConfigurationBuilder();
        builder.addEnvironmentFile("./tests/configuration/config.unprefixed.env");
        const object = await builder.build(Configuration);

        expect(object).not.toBeNull();
        expect(object.value).toBe("Env object");

        expect(object.complexObject).not.toBeNull();
        expect(object.complexObject?.value).toBe("Complex env object value");

        expect(object.complexArray).not.toBeNull();
        expect(object.complexArray).toHaveLength(2);
        expect(object.complexArray?.[0]).toBe("First env array value");
        expect(object.complexArray?.[1]).toBe("Second env array value");
    });

    it("should add and build from multiple sources", async () => {
        clearEnvironment();

        process.env.value = "Env object";
        process.env.complexObject__value = "Complex env object value";
        process.env.complexArray__0 = "First env array value";
        process.env.complexArray__1 = "Second env array value";

        const builder = new ConfigurationBuilder()
            .addJsonFile("./tests/configuration/config.json")
            .addEnvironmentVariables()
            .addEnvironmentFile("./tests/configuration/config.unprefixed.env");

        const object = await builder.build(Configuration);

        expect(object).not.toBeNull();
        expect(object.value).toBe("Env object");

        expect(object.complexObject).not.toBeNull();
        expect(object.complexObject?.value).toBe("Complex env object value");

        expect(object.complexArray).not.toBeNull();
        expect(object.complexArray).toHaveLength(2);
        expect(object.complexArray?.[0]).toBe("First env array value");
        expect(object.complexArray?.[1]).toBe("Second env array value");
    });

    it("should merge different structures sources", async () => {
        clearEnvironment();

        process.env.value = "Env object";
        process.env.complexObject__value = "Complex env object value";
        process.env.complexArray__0 = "First env array value";
        process.env.complexArray__1 = "Second env array value";
        process.env.complexArray__2 = "Third env array value";
        process.env.complexArray__3 = "Fourth env array value";

        const builder = new ConfigurationBuilder()
            .addJsonFile("./tests/configuration/config.json")
            .addEnvironmentVariables()
            .addEnvironmentFile("./tests/configuration/config.unprefixed.env");

        const object = await builder.build(Configuration);

        expect(object).not.toBeNull();
        expect(object.value).toBe("Env object");

        expect(object.complexObject).not.toBeNull();
        expect(object.complexObject?.value).toBe("Complex env object value");

        expect(object.complexArray).not.toBeNull();
        expect(object.complexArray).toHaveLength(4);
        expect(object.complexArray?.[0]).toBe("First env array value");
        expect(object.complexArray?.[1]).toBe("Second env array value");
        expect(object.complexArray?.[2]).toBe("Third env array value");
        expect(object.complexArray?.[3]).toBe("Fourth env array value");
    });

    it("should cache configuration", async () => {
        clearEnvironment();

        process.env.value = "Env object";
        process.env.complexObject__value = "Complex env object value";
        process.env.complexArray__0 = "First env array value";
        process.env.complexArray__1 = "Second env array value";
        process.env.complexArray__2 = "Third env array value";
        process.env.complexArray__3 = "Fourth env array value";

        const builder = new ConfigurationBuilder()
            .addJsonFile("./tests/configuration/config.json")
            .addEnvironmentVariables()
            .addEnvironmentFile("./tests/configuration/config.unprefixed.env");

        let object = await builder.build(Configuration);
        (object as any)["__modified"] = true;

        object = await builder.build(Configuration);
        expect((object as any)["__modified"]).toBe(true);
    });

    it("should rebuild configuration if asked", async () => {
        clearEnvironment();

        process.env.value = "Env object";
        process.env.complexObject__value = "Complex env object value";
        process.env.complexArray__0 = "First env array value";
        process.env.complexArray__1 = "Second env array value";
        process.env.complexArray__2 = "Third env array value";
        process.env.complexArray__3 = "Fourth env array value";

        const builder = new ConfigurationBuilder()
            .addJsonFile("./tests/configuration/config.json")
            .addEnvironmentVariables()
            .addEnvironmentFile("./tests/configuration/config.unprefixed.env");

        let object = await builder.build(Configuration);
        (object as any)["__modified"] = true;

        object = await builder.build(Configuration, false);
        expect((object as any)["__modified"]).toBe(undefined);
    });

    it("should rebuild configuration if configuration class changed", async () => {
        clearEnvironment();

        process.env.value = "Env object";
        process.env.complexObject__value = "Complex env object value";
        process.env.complexArray__0 = "First env array value";
        process.env.complexArray__1 = "Second env array value";
        process.env.complexArray__2 = "Third env array value";
        process.env.complexArray__3 = "Fourth env array value";

        const builder = new ConfigurationBuilder()
            .addJsonFile("./tests/configuration/config.json")
            .addEnvironmentVariables()
            .addEnvironmentFile("./tests/configuration/config.unprefixed.env");

        let object = await builder.build(Configuration);
        (object as any)["__modified"] = true;

        object = await builder.build(SecondConfiguration);
        expect((object as any)["__modified"]).toBe(undefined);
    });
});
