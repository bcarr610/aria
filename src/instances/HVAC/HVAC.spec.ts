import { wait } from "../../utils";
import { expectGPIO, expectSoftTimeCloseTo } from "../../test/utils";
import GPIO from "../GPIO";
import HVAC from "./HVAC";

let compressor = new GPIO(0);
let heatPump = new GPIO(1);
let auxHeat = new GPIO(2);
let fan = new GPIO(3);
let hvac = new HVAC(5, 10, compressor, heatPump, auxHeat, fan);

beforeEach(() => {
  compressor = new GPIO(0);
  heatPump = new GPIO(1);
  auxHeat = new GPIO(2);
  fan = new GPIO(3);
  hvac = new HVAC(5, 10, compressor, heatPump, auxHeat, fan);
});

afterEach(() => {
  jest.clearAllMocks();
});

describe("HVAC.sendUpdate", () => {
  it("Should trigger onUpdate", () => {
    const mock = jest.spyOn(hvac as any, "_onUpdate");
    hvac["sendUpdate"]();
    expect(mock).toHaveBeenCalledTimes(1);
  });
});

describe("HVAC.on", () => {
  it("Should try to switch component on", () => {
    hvac["on"]("compressor");
    expect(hvac["components"].compressor.value).toBe(1);
  });
});

describe("HVAC.off", () => {
  it("Should try to switch component on", () => {
    hvac["on"]("compressor");
    hvac["off"]("compressor");
    expect(hvac["components"].compressor.value).toBe(0);
  });
});

describe("HVAC.minWaitTimeReachedAt", () => {
  it("Should return time time since idle", () => {
    const res = hvac["minWaitTimeReachedAt"];
    const d = new Date();
    d.setTime(d.getTime() + hvac["transitionTime"]);
    expectSoftTimeCloseTo(res, d);
  });
});

describe("HVAC.idle", () => {
  it("Should go idle", () => {
    const state = "IDLE";
    const mock = jest.spyOn(hvac as any, "sendUpdate");
    hvac["idle"]();
    expect(hvac.state).toBe(state);
    expect(mock).toHaveBeenCalledTimes(1);
    expectGPIO(hvac, state);
  });
});

describe("HVAC.circulate", () => {
  it("Should circulate", () => {
    const state = "CIRCULATE";
    const mock = jest.spyOn(hvac as any, "sendUpdate");
    hvac["circulate"]();
    expect(hvac.state).toBe(state);
    expect(mock).toHaveBeenCalledTimes(1);
    expectGPIO(hvac, state);
  });
});

describe("HVAC.cool", () => {
  it("Should cool", () => {
    const state = "COOL";
    const mock = jest.spyOn(hvac as any, "sendUpdate");
    hvac["cool"]();
    expect(hvac.state).toBe(state);
    expect(mock).toHaveBeenCalledTimes(1);
    expectGPIO(hvac, state);
  });
});

describe("HVAC.heat", () => {
  it("Should heat", () => {
    const state = "HEAT";
    const mock = jest.spyOn(hvac as any, "sendUpdate");
    hvac["heat"]();
    expect(hvac.state).toBe(state);
    expect(mock).toHaveBeenCalledTimes(1);
    expectGPIO(hvac, state);
  });
});

describe("HVAC.auxHeat", () => {
  it("Should trigger auxHeat", () => {
    const state = "HEAT_AUX";
    const mock = jest.spyOn(hvac as any, "sendUpdate");
    hvac["auxHeat"]();
    expect(hvac.state).toBe(state);
    expect(mock).toHaveBeenCalledTimes(1);
    expectGPIO(hvac, state);
  });
});

describe("HVAC.queue", () => {
  it("Should not trigger if setting new state to existing state", () => {
    const oldAction = hvac.nextAction;
    hvac.queue("IDLE");
    expect(hvac.nextAction).toEqual(oldAction);
  });

  it("Should transition from idle to non-idle with min cycle time", () => {
    hvac["cool"]();
    hvac.queue("IDLE");
    expect(hvac.nextAction).not.toBeNull();
    expect(hvac.nextAction?.state).toBe("IDLE");
    expect(hvac.nextAction?.idleFirst).toBe(false);
    expectSoftTimeCloseTo(
      hvac.nextAction?.at || new Date(),
      new Date(new Date().getTime() + hvac["minCycleTime"])
    );
  });

  it("Should transition from non-idle to idle with transition time", () => {
    hvac["idle"]();
    hvac.queue("COOL");
    expect(hvac.nextAction).not.toBeNull();
    expect(hvac.nextAction?.state).toBe("COOL");
    expect(hvac.nextAction?.idleFirst).toBe(false);
    expectSoftTimeCloseTo(
      hvac.nextAction?.at || new Date(),
      new Date(new Date().getTime() + hvac["transitionTime"])
    );
  });

  it("Should transition from non-idle to non-idle while idling before transition", () => {
    hvac["cool"]();
    hvac.queue("HEAT");
    expect(hvac.nextAction).not.toBeNull();
    expect(hvac.nextAction?.state).toBe("HEAT");
    expect(hvac.nextAction?.idleFirst).toBe(true);
    expectSoftTimeCloseTo(
      hvac.nextAction?.at || new Date(),
      new Date(new Date().getTime() + hvac["minCycleTime"])
    );
  });

  it("Should transition to HEAT_AUX immediately from HEAT", () => {
    hvac["heat"]();
    hvac.queue("HEAT_AUX");
    expect(hvac.nextAction).not.toBeNull();
    expect(hvac.nextAction?.state).toBe("HEAT_AUX");
    expect(hvac.nextAction?.idleFirst).toBe(false);
    expectSoftTimeCloseTo(hvac.nextAction?.at || new Date(), new Date());
  });

  it("Should not idle when switching to circulate", () => {
    hvac["cool"]();
    hvac.queue("CIRCULATE");
    expect(hvac.nextAction).not.toBeNull();
    expect(hvac.nextAction?.state).toBe("CIRCULATE");
    expect(hvac.nextAction?.idleFirst).toBe(false);
    expectSoftTimeCloseTo(hvac.nextAction?.at || new Date(), new Date());
  });
});

describe("HVAC.clock", () => {
  it("Should trigger idle first and set next action when idle first required", async () => {
    hvac["heat"]();
    hvac.queue("COOL");
    hvac.clock();
    expect(hvac.state).toBe("HEAT");
    expectGPIO(hvac, "HEAT");
    hvac.clock();
    await wait(11);
    hvac.clock();
    expect(hvac.state).toBe("IDLE");
    expectGPIO(hvac, "IDLE");
    hvac.clock();
    await wait(6);
    hvac.clock();
    expect(hvac.state).toBe("COOL");
    expectGPIO(hvac, "COOL");
  });

  it("Should trigger state from idle without idling first", async () => {
    hvac["idle"]();
    hvac.queue("COOL");
    hvac.clock();
    expect(hvac.state).toBe("IDLE");
    expectGPIO(hvac, "IDLE");
    await wait(6);
    hvac.clock();
    expect(hvac.state).toBe("COOL");
    expectGPIO(hvac, "COOL");
  });
});
