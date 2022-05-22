import { IActionDescriptor } from "./action-descriptor.interface";
import { ActionType } from "./action-type";
import { HttpMethod } from "../shared/http-method";
import { ObjectType } from "@miracledevs/paradigm-web-di";
import { ActionTypeCollection } from "./action-type-collection";
import "reflect-metadata";
import { getObjectTypeName } from "@miracledevs/paradigm-web-di/object-type";

export function Action(actionDescriptor?: IActionDescriptor): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void {
    return (controller: ObjectType, methodName: string, _: PropertyDescriptor): void => {
        const controllerName = getObjectTypeName(controller);

        if (!controller) throw new Error("Can not decorate a null or undefined value as a controller.");

        if (!methodName) throw new Error("Can not decorate a null or undefined method as an action.");

        if (ActionTypeCollection.globalInstance.contains(controllerName, methodName)) throw new Error(`The action '${controllerName}.${methodName}' was already registered.`);

        if (!actionDescriptor)
            actionDescriptor = {
                route: "",
                query: "",
                filters: [],
                fromBody: false,
                method: HttpMethod.GET,
            } as IActionDescriptor;

        if (!actionDescriptor.method) {
            const methodByConvention: HttpMethod | undefined = (<any>HttpMethod)[methodName.toUpperCase()];
            actionDescriptor.method = methodByConvention ? methodByConvention : HttpMethod.GET;
        }

        const actionType = new ActionType(
            controller.constructor as ObjectType,
            methodName,
            actionDescriptor,
            Reflect.getMetadata("design:paramtypes", controller, methodName),
            Reflect.getMetadata("design:returntype", controller, methodName)
        );

        ActionTypeCollection.globalInstance.register(actionType);
    };
}
