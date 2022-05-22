import { IControllerDescriptor } from "./controller-descriptor.interface";
import { ControllerTypeCollection } from "./controller-type-collection";
import { ControllerType } from "./controller-type";
import { Injectable, DependencyLifeTime, ObjectType } from "@miracledevs/paradigm-web-di";
import { getObjectTypeName } from "@miracledevs/paradigm-web-di/object-type";

export function Controller(descriptor: IControllerDescriptor): <T>(controller: ObjectType<T>) => void {
    if (!descriptor) throw new Error("The controller descriptor is mandatory.");

    return <T>(controller: ObjectType<T>): void => {
        if (!controller) throw new Error("Can not decorate a null or undefined value as a controller.");

        if (ControllerTypeCollection.globalInstance.contains(controller)) throw new Error(`The controller ${getObjectTypeName(controller)} is already registered.`);

        ControllerTypeCollection.globalInstance.register(new ControllerType(controller, descriptor));
        Injectable({ lifeTime: DependencyLifeTime.Scoped })(controller);
    };
}
