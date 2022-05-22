import { ControllerType } from "../decorators/controller-type";
import { ActionType } from "../decorators/action-type";
import { getObjectTypeName } from "@miracledevs/paradigm-web-di/object-type";

export class RoutingContext {
    constructor(public readonly controllerType: ControllerType, public readonly actionType: ActionType) {}

    toString(): string {
        return `${getObjectTypeName(this.controllerType.type)}.${this.actionType.methodName}`;
    }
}
