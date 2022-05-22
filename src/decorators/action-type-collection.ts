import { ActionType } from "./action-type";

export class ActionTypeCollection {
    private static _globalInstance: ActionTypeCollection;

    public static get globalInstance(): ActionTypeCollection {
        if (!ActionTypeCollection._globalInstance) ActionTypeCollection._globalInstance = new ActionTypeCollection();

        return ActionTypeCollection._globalInstance;
    }

    private readonly _registeredTypes: ActionType[];

    private constructor() {
        this._registeredTypes = [];
    }

    register(actionType: ActionType): void {
        if (this.contains(actionType.controllerName, actionType.methodName))
            throw new Error(`The action ${actionType.controllerName}.${actionType.methodName} is already registered.`);

        this._registeredTypes.push(actionType);
    }

    get(controllerName: string, actionName: string): ActionType {
        const action = this._registeredTypes.find(x => x.methodName === actionName && x.controllerName === controllerName);

        if (!action) throw new Error(`The action ${controllerName}.${actionName} is not registered.`);

        return action;
    }

    contains(controllerName: string, actionName: string): boolean {
        const action = this._registeredTypes.find(x => x.methodName === actionName && x.controllerName === controllerName);
        return action !== null && action !== undefined;
    }

    getForController(controllerName: string): ActionType[] {
        return this._registeredTypes.filter(x => x.controllerName === controllerName);
    }

    getRegisteredActionTypes(): ActionType[] {
        return this._registeredTypes.slice();
    }
}
