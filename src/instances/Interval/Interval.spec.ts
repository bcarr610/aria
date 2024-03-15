import Interval from "./Interval";
import { wait } from "../../utils";

class TestClass {
  testVal: number;

  constructor(testVal: number) {
    this.testVal = testVal;
  }

  increment() {
    this.testVal += 1;
  }

  get val() {
    return this.testVal;
  }
}

describe("Interval", () => {
  it("Should execute a class handler properly", async () => {
    const timesToFire = 5;
    const test = new TestClass(0);
    const incrementMock = jest.spyOn(test, "increment");

    const interval = new Interval(100, test.increment.bind(test));
    interval.start();

    await wait(499);
    interval.stop();
    await wait(50);
    expect(incrementMock).toHaveBeenCalledTimes(timesToFire);
    expect(test.testVal).toBe(timesToFire);
  });
});
