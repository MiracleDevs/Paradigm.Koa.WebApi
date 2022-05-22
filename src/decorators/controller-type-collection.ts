import { ControllerType } from "./controller-type";
import { ObjectType } from "@miracledevs/paradigm-web-di";
import { getObjectTypeName } from "@miracledevs/paradigm-web-di/object-type";

export class ControllerTypeCollection {
    private static _globalInstance: ControllerTypeCollection;

    public static get globalInstance(): ControllerTypeCollection {
        if (!ControllerTypeCollection._globalInstance) ControllerTypeCollection._globalInstance = new ControllerTypeCollection();

        return ControllerTypeCollection._globalInstance;
    }

    private readonly _registeredTypes: Map<ObjectType, ControllerType>;

    private constructor() {
        this._registeredTypes = new Map<ObjectType, ControllerType>();
    }

    register(controllerType: ControllerType): void {
        if (this._registeredTypes.has(controllerType.type)) throw new Error(`The controller ${getObjectTypeName(controllerType.type)} is already registered.`);

        this._registeredTypes.set(controllerType.type, controllerType);
    }

    get(controller: ObjectType): ControllerType {
        const instance = this._registeredTypes.get(controller);
        if (!instance) throw new Error(`The controller ${getObjectTypeName(controller)} is not registered.`);
        return instance;
    }

    contains(controller: ObjectType): boolean {
        return this._registeredTypes.has(controller);
    }

    getControllers(): IterableIterator<ControllerType> {
        return this._registeredTypes.values();
    }
}
