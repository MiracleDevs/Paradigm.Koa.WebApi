import { IControllerDescriptor } from "./controller-descriptor.interface";
import { ObjectType } from "@miracledevs/paradigm-web-di";

export class ControllerType {
    public readonly type: ObjectType;
    public readonly descriptor: IControllerDescriptor;

    constructor(type: ObjectType, descriptor: IControllerDescriptor) {
        this.type = type;
        this.descriptor = descriptor;
    }
}
