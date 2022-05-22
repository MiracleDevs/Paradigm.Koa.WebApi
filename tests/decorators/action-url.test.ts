import { ActionUrl, RouteParameterType } from "../../src/decorators/action-url";
import { ActionType } from "../../src/decorators/action-type";

describe("Action URL", () => {
    class ActionUrlController {
        async action1(var1: number, var2: string, var3: boolean, var4: Date): Promise<void> {}

        async action2(var1: number, var2: string): Promise<void> {}
    }

    it("should parse an action url", () => {
        const actionUrl = ActionUrl.parse(
            "/route1/:var1/route2/:var2",
            ":var3&:var4&const",
            new ActionType(ActionUrlController, "action1", {}, [Number, String, Boolean, Date], Promise)
        );

        expect(actionUrl).not.toBeNull();
        expect(actionUrl.segments).toHaveLength(4);
        expect(actionUrl.queryString).toHaveLength(3);
        expect(actionUrl.parameters).toHaveLength(4);

        expect(actionUrl.segments[0]).toBe("route1");
        expect(actionUrl.segments[1]).toBe(":var1");
        expect(actionUrl.segments[2]).toBe("route2");
        expect(actionUrl.segments[3]).toBe(":var2");

        expect(actionUrl.queryString[0]).toBe(":var3");
        expect(actionUrl.queryString[1]).toBe(":var4");
        expect(actionUrl.queryString[2]).toBe("const");

        expect(actionUrl.parameters[0].name).toBe("var1");
        expect(actionUrl.parameters[0].parameterType).toBe(RouteParameterType.Segment);
        expect(actionUrl.parameters[0].dataType).toBe(Number);

        expect(actionUrl.parameters[1].name).toBe("var2");
        expect(actionUrl.parameters[1].parameterType).toBe(RouteParameterType.Segment);
        expect(actionUrl.parameters[1].dataType).toBe(String);

        expect(actionUrl.parameters[2].name).toBe("var3");
        expect(actionUrl.parameters[2].parameterType).toBe(RouteParameterType.QueryStringVariable);
        expect(actionUrl.parameters[2].dataType).toBe(Boolean);

        expect(actionUrl.parameters[3].name).toBe("var4");
        expect(actionUrl.parameters[3].parameterType).toBe(RouteParameterType.QueryStringVariable);
        expect(actionUrl.parameters[3].dataType).toBe(Date);
    });

    it("should parse an action url with an empty route", () => {
        const actionUrl = ActionUrl.parse("", ":var1&:var2", new ActionType(ActionUrlController, "action2", {}, [Number, String], Promise));

        expect(actionUrl).not.toBeNull();
        expect(actionUrl.segments).toHaveLength(0);
        expect(actionUrl.queryString).toHaveLength(2);
        expect(actionUrl.parameters).toHaveLength(2);

        expect(actionUrl.queryString[0]).toBe(":var1");
        expect(actionUrl.queryString[1]).toBe(":var2");

        expect(actionUrl.parameters[0].name).toBe("var1");
        expect(actionUrl.parameters[0].parameterType).toBe(RouteParameterType.QueryStringVariable);
        expect(actionUrl.parameters[0].dataType).toBe(Number);

        expect(actionUrl.parameters[1].name).toBe("var2");
        expect(actionUrl.parameters[1].parameterType).toBe(RouteParameterType.QueryStringVariable);
        expect(actionUrl.parameters[1].dataType).toBe(String);
    });

    it("should parse an action url without route", () => {
        const actionUrl = ActionUrl.parse(null as any, ":var1&:var2", new ActionType(ActionUrlController, "action2", {}, [Number, String], Promise));

        expect(actionUrl).not.toBeNull();
        expect(actionUrl.segments).toHaveLength(0);
        expect(actionUrl.queryString).toHaveLength(2);
        expect(actionUrl.parameters).toHaveLength(2);

        expect(actionUrl.queryString[0]).toBe(":var1");
        expect(actionUrl.queryString[1]).toBe(":var2");

        expect(actionUrl.parameters[0].name).toBe("var1");
        expect(actionUrl.parameters[0].parameterType).toBe(RouteParameterType.QueryStringVariable);
        expect(actionUrl.parameters[0].dataType).toBe(Number);

        expect(actionUrl.parameters[1].name).toBe("var2");
        expect(actionUrl.parameters[1].parameterType).toBe(RouteParameterType.QueryStringVariable);
        expect(actionUrl.parameters[1].dataType).toBe(String);
    });

    it("should parse an action url with an empty query string", () => {
        const actionUrl = ActionUrl.parse(":var1/:var2", "", new ActionType(ActionUrlController, "action2", {}, [Number, String], Promise));

        expect(actionUrl).not.toBeNull();
        expect(actionUrl.segments).toHaveLength(2);
        expect(actionUrl.queryString).toHaveLength(0);
        expect(actionUrl.parameters).toHaveLength(2);

        expect(actionUrl.segments[0]).toBe(":var1");
        expect(actionUrl.segments[1]).toBe(":var2");

        expect(actionUrl.parameters[0].name).toBe("var1");
        expect(actionUrl.parameters[0].parameterType).toBe(RouteParameterType.Segment);
        expect(actionUrl.parameters[0].dataType).toBe(Number);

        expect(actionUrl.parameters[1].name).toBe("var2");
        expect(actionUrl.parameters[1].parameterType).toBe(RouteParameterType.Segment);
        expect(actionUrl.parameters[1].dataType).toBe(String);
    });

    it("should parse an action url without a query string", () => {
        const actionUrl = ActionUrl.parse(":var1/:var2", null as any, new ActionType(ActionUrlController, "action2", {}, [Number, String], Promise));

        expect(actionUrl).not.toBeNull();
        expect(actionUrl.segments).toHaveLength(2);
        expect(actionUrl.queryString).toHaveLength(0);
        expect(actionUrl.parameters).toHaveLength(2);

        expect(actionUrl.segments[0]).toBe(":var1");
        expect(actionUrl.segments[1]).toBe(":var2");

        expect(actionUrl.parameters[0].name).toBe("var1");
        expect(actionUrl.parameters[0].parameterType).toBe(RouteParameterType.Segment);
        expect(actionUrl.parameters[0].dataType).toBe(Number);

        expect(actionUrl.parameters[1].name).toBe("var2");
        expect(actionUrl.parameters[1].parameterType).toBe(RouteParameterType.Segment);
        expect(actionUrl.parameters[1].dataType).toBe(String);
    });

    it("should fail if an action type is not provided", () => {
        expect(() => ActionUrl.parse(":var1/:var2", ":var3&:var4", null as any)).toThrowError("Can't create an action url without an action type.");
    });
});
