import { Controller } from "../../src/decorators/controller";
import { ControllerTypeCollection } from "../../src/decorators/controller-type-collection";

describe("Controller", () => {
    @Controller({ route: "route" })
    class TestController {}

    it("should return a function", () => expect(Controller({ route: "" })).toBeInstanceOf(Function));

    it("should register the class", () => expect(ControllerTypeCollection.globalInstance.contains(TestController)).toBeTruthy());

    it("shouldn't allow to pass a null type", () =>
        expect(() => Controller({ route: "" })(null as any)).toThrowError("Can not decorate a null or undefined value as a controller."));

    it("shouldn't allow to pass a null descriptor", () => expect(() => Controller(null as any)).toThrowError("The controller descriptor is mandatory."));

    it("shouldn't allow to register controller twice", () =>
        expect(() => Controller({ route: "" })(TestController)).toThrowError("The controller TestController is already registered."));
});
