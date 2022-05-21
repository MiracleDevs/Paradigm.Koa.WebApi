import { demo } from "../src/index";

describe("index", () => {
    describe("demo function", () => {
        it("should sum two numbers", () => {
            expect(demo(1, 2)).toBe(3);
        });
    });
});
