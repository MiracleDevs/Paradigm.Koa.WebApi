import { Action } from "../../src/decorators/action";
import { ActionType } from "../../src/decorators/action-type";
import { getObjectTypeName } from "@miracledevs/paradigm-web-di/object-type";
import { ActionTypeCollection } from "../../src/decorators/action-type-collection";

describe("Action Type Collection", () => {
    class ActionTestController {
        action(): void {}

        @Action()
        otherAction(): void {}
    }

    it("should have a global instance", () => expect(ActionTypeCollection.globalInstance).not.toBeNull());

    it("should allow register and get action type", () => {
        const actionType = new ActionType(ActionTestController, "action", {}, [], undefined as any);
        ActionTypeCollection.globalInstance.register(actionType);
        expect(ActionTypeCollection.globalInstance.get(getObjectTypeName(ActionTestController), "action")).toBe(actionType);
    });

    it("shouldn't allow to register an action twice", () => {
        const actionType = new ActionType(ActionTestController, "action", {}, [], undefined as any);
        expect(() => ActionTypeCollection.globalInstance.register(actionType)).toThrowError("The action ActionTestController.action is already registered.");
    });

    it("should indicate if contains or not a controller", () => {
        class MyClass {}
        expect(ActionTypeCollection.globalInstance.contains(getObjectTypeName(ActionTestController), "action")).toBeTruthy();
        expect(ActionTypeCollection.globalInstance.contains(getObjectTypeName(MyClass), "action")).toBeFalsy();
    });

    it("should return controller actions", () => {
        const actions = ActionTypeCollection.globalInstance.getForController(getObjectTypeName(ActionTestController));
        expect(actions).toHaveLength(2);
        expect(actions[0].methodName).toBe("otherAction");
        expect(actions[1].methodName).toBe("action");
    });

    it("shouldn't return controller actions if controller is not registered", () => {
        class MyClass {}
        const actions = ActionTypeCollection.globalInstance.getForController(getObjectTypeName(MyClass));
        expect(actions).toHaveLength(0);
    });

    it("should return all the actions", () => {
        const actions = ActionTypeCollection.globalInstance.getRegisteredActionTypes();
        expect(actions).not.toBeNull();
        expect(actions.length).toBeGreaterThanOrEqual(2);
    });

    it("shouldn't get an action that is not registered", () => {
        expect(() => ActionTypeCollection.globalInstance.get("MyClass", "MyAction")).toThrowError("The action MyClass.MyAction is not registered.");
    });
});
