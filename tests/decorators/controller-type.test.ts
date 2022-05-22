import { ControllerType } from "../../src/decorators/controller-type";

describe("Controller Type", () => {
    it("Should instantiate the http context", () => expect(new ControllerType(ControllerType, { route: "" })).not.toBeNull());
});
