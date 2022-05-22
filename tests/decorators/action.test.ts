import { Controller } from "../../src/decorators/controller";
import { Action } from "../../src/decorators/action";
import { ActionTypeCollection } from "../../src/decorators/action-type-collection";
import { getObjectTypeName } from "@miracledevs/paradigm-web-di/object-type";
import { HttpMethod } from "../../src/shared/http-method";
import { RouteParameterType } from "../../src/decorators/action-url";

describe("Action", () => {
    @Controller({ route: "route" })
    class TestController {
        @Action()
        public action(): void {}

        @Action({ route: "route/:var1", method: HttpMethod.POST, query: ":var2&:var3", fromBody: true, filters: [] })
        public async action_descriptor(var1: number, var2: string, var3: Date): Promise<void> {}

        @Action()
        public get(): void {}

        @Action()
        public post(): void {}

        @Action()
        public delete(): void {}

        @Action()
        public put(): void {}
    }

    it("should return a function", () => expect(Action()).toBeInstanceOf(Function));

    it("should register the action", () => expect(ActionTypeCollection.globalInstance.getForController(getObjectTypeName(TestController))).toBeTruthy());

    it("shouldn't allow to pass a null type", () =>
        expect(() => Action()(null, null as any, null as any)).toThrowError("Can not decorate a null or undefined value as a controller."));

    it("shouldn't allow to pass a null method", () =>
        expect(() => Action()(TestController, null as any, null as any)).toThrowError("Can not decorate a null or undefined method as an action."));

    it("should allow to pass a null descriptor", () => expect(() => Action()(TestController, "someAction", null as any)).not.toThrowError());

    it("shouldn't allow to register action twice", () =>
        expect(() => Action()(TestController, "action", null as any)).toThrowError("The action 'TestController.action' was already registered."));

    it("should take the descriptor info", () => {
        const action = ActionTypeCollection.globalInstance.get(getObjectTypeName(TestController), "action_descriptor");

        expect(action).not.toBeNull();
        expect(action.actionUrl).not.toBeNull();
        expect(action.actionUrl.queryString).toHaveLength(2);
        expect(action.actionUrl.queryString[0]).toBe(":var2");
        expect(action.actionUrl.queryString[1]).toBe(":var3");

        expect(action.actionUrl.parameters).toHaveLength(3);
        expect(action.actionUrl.parameters[0].name).toBe("var1");
        expect(action.actionUrl.parameters[0].dataType).toBe(Number);
        expect(action.actionUrl.parameters[0].parameterType).toBe(RouteParameterType.Segment);
        expect(action.actionUrl.parameters[1].name).toBe("var2");
        expect(action.actionUrl.parameters[1].dataType).toBe(String);
        expect(action.actionUrl.parameters[1].parameterType).toBe(RouteParameterType.QueryStringVariable);
        expect(action.actionUrl.parameters[2].name).toBe("var3");
        expect(action.actionUrl.parameters[2].dataType).toBe(Date);
        expect(action.actionUrl.parameters[2].parameterType).toBe(RouteParameterType.QueryStringVariable);

        expect(action.actionUrl.segments).toHaveLength(2);
        expect(action.actionUrl.segments[0]).toBe("route");
        expect(action.actionUrl.segments[1]).toBe(":var1");

        expect(action.controllerName).toBe(getObjectTypeName(TestController));
        expect(action.methodName).toBe("action_descriptor");
        expect(action.controllerType).toBe(TestController);
        expect(action.returnType).toBe(Promise);
        expect(action.parameters).toHaveLength(3);

        expect(action.parameters[0]).toBe(Number);
        expect(action.parameters[1]).toBe(String);
        expect(action.parameters[2]).toBe(Date);

        expect(action.descriptor).not.toBeNull();
        expect(action.descriptor.route).toBe("route/:var1");
        expect(action.descriptor.query).toBe(":var2&:var3");
        expect(action.descriptor.method).toBe(HttpMethod.POST);
        expect(action.descriptor.fromBody).toBe(true);
        expect(action.descriptor.filters).toHaveLength(0);
    });

    it("should take info from a default descriptor", () => {
        const action = ActionTypeCollection.globalInstance.get(getObjectTypeName(TestController), "action");

        expect(action).not.toBeNull();
        expect(action.actionUrl).not.toBeNull();
        expect(action.actionUrl.queryString).toHaveLength(0);
        expect(action.actionUrl.parameters).toHaveLength(0);
        expect(action.actionUrl.segments).toHaveLength(0);
        expect(action.controllerName).toBe(getObjectTypeName(TestController));
        expect(action.methodName).toBe("action");
        expect(action.controllerType).toBe(TestController);
        expect(action.returnType).toBe(undefined);
        expect(action.parameters).toHaveLength(0);
        expect(action.descriptor).not.toBeNull();
        expect(action.descriptor.route).toBe("");
        expect(action.descriptor.query).toBe("");
        expect(action.descriptor.method).toBe(HttpMethod.GET);
        expect(action.descriptor.fromBody).toBe(false);
        expect(action.descriptor.filters).toHaveLength(0);
    });

    it("should take http verb from name if not provided", () => {
        expect(ActionTypeCollection.globalInstance.get(getObjectTypeName(TestController), "get").descriptor.method).toBe(HttpMethod.GET);
        expect(ActionTypeCollection.globalInstance.get(getObjectTypeName(TestController), "post").descriptor.method).toBe(HttpMethod.POST);
        expect(ActionTypeCollection.globalInstance.get(getObjectTypeName(TestController), "delete").descriptor.method).toBe(HttpMethod.DELETE);
        expect(ActionTypeCollection.globalInstance.get(getObjectTypeName(TestController), "put").descriptor.method).toBe(HttpMethod.PUT);
    });
});
