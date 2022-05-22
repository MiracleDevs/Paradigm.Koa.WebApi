import { ActionType } from "../../src/decorators/action-type";
import { Controller } from "../../src/decorators/controller";
import { Action } from "../../src/decorators/action";
import { ActionTypeCollection } from "../../src/decorators/action-type-collection";
import { getObjectTypeName } from "@miracledevs/paradigm-web-di/object-type";

describe("Action Type", () => {
    @Controller({ route: "route" })
    class TestController {
        actionCalled: boolean = false;

        @Action()
        public action(): void {
            this.actionCalled = true;
        }
    }

    it("Should instantiate the action type", () => expect(new ActionType(ActionType, "method_name", { route: "" }, [], ActionType)).not.toBeNull());

    it("Should call the action method", () => {
        const actionType = ActionTypeCollection.globalInstance.get(getObjectTypeName(TestController), "action");
        const controller = new TestController();
        const method = actionType.getExecutableMethod(controller);
        method.apply(controller);
        expect(controller.actionCalled).toBeTruthy();
    });

    it("Should fail trying to execute an un-existing method", () => {
        const actionType = ActionTypeCollection.globalInstance.get(getObjectTypeName(TestController), "action");
        const controller = new TestController();
        (controller as any).action = null;
        expect(() => actionType.getExecutableMethod(controller)).toThrowError("The method or action 'action' does not exist in 'TestController'.");
    });
});
