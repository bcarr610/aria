import GPIO from "./GPIO";

describe("GPIO", () => {
  beforeEach(() => {
    process.env.EMULATE = "true";
  });

  it("Should initialize", () => {
    const gpio = new GPIO(1, "out");
    expect(gpio.gpio).toBeNull();
    expect(gpio.emulate).toBe(true);
    expect(gpio.pin).toBe(1);
    expect(gpio.value).toBe(0);

    const gpio2 = new GPIO(2, "high");
    expect(gpio2.value).toBe(1);
  });

  it("Should read", () => {
    const gpio = new GPIO(1, "in");
    const res1 = gpio.readSync();
    expect(res1).toBe(0);
    gpio.on();
    const res2 = gpio.readSync();
    expect(res2).toBe(1);
  });

  it("Should turn off", () => {
    const gpio = new GPIO(1, "high");
    const res1 = gpio.readSync();
    expect(res1).toBe(1);
    gpio.off();
    const res2 = gpio.readSync();
    expect(res2).toBe(0);
    expect(gpio.isOn).toBe(false);
  });

  it("Should not enumlate", () => {
    delete process.env.EMULATE;
    try {
      const gpio = new GPIO(1, "out");
      const res = gpio.readSync();
    } catch (err: unknown) {
      const e = err as Error;
      expect(e.message.slice(0, 6)).toBe("EACCES");
    }
  });
});
