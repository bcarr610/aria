import { expectSoftTimeCloseTo } from "../../test/utils";
import GPIO from "./GPIO";

let gpio: GPIO;
beforeEach(() => {
  gpio = new GPIO(1, "out");
});

describe("GPIO.constructor", () => {
  it("Should set times", () => {
    expectSoftTimeCloseTo(gpio.lastHighTime, new Date());
    expectSoftTimeCloseTo(gpio.lastLowTime, new Date());
    expectSoftTimeCloseTo(gpio.lastValueChange, new Date());
  });

  it("Should set values for out", () => {
    expect(gpio.value).toBe(0);
  });

  it("Should set values for high", () => {
    gpio = new GPIO(1, "high");
    expect(gpio.value).toBe(1);
  });

  it("Should set values for low", () => {
    gpio = new GPIO(1, "low");
    expect(gpio.value).toBe(0);
  });

  it("Should set value for analog", () => {
    gpio = new GPIO(1, "in");
    expect(gpio.value).toBe(0);
  });
});

describe("get GPIO.value", () => {
  it("Should return value", () => {
    expect(gpio.value).toBe(0);
  });
});

describe("set GPIO.value", () => {
  it("Should set value", () => {
    gpio.value = 1;
    expect(gpio.value).toBe(1);
  });
});
