import HVAC from "../instances/HVAC";

const ce = console.error;
const ci = console.info;
const cl = console.log;
const cw = console.warn;

export const disableLogs = () => {
  console.error = () => {};
  console.info = () => {};
  console.log = () => {};
  console.warn = () => {};
};

export const enableLogs = () => {
  console.error = ce;
  console.info = ci;
  console.log = cl;
  console.warn = cw;
};

export const softDateNum = (date: Date): number => date.getTime() / 60000;

export const expectSoftTimeCloseTo = (d1: Date, d2: Date): void => {
  const s1 = softDateNum(d1);
  const s2 = softDateNum(d2);
  expect(s1).toBeCloseTo(s2, 1);
};

export const expectGPIO = (hvac: HVAC, state: HVACState) => {
  const { compressor, heatPump, auxHeat, fan } = hvac["components"];
  if (state === "IDLE") {
    expect(compressor.value).toBe(0);
    expect(heatPump.value).toBe(0);
    expect(auxHeat.value).toBe(0);
    expect(fan.value).toBe(0);
  } else if (state === "CIRCULATE") {
    expect(compressor.value).toBe(0);
    expect(heatPump.value).toBe(0);
    expect(auxHeat.value).toBe(0);
    expect(fan.value).toBe(1);
  } else if (state === "COOL") {
    expect(compressor.value).toBe(1);
    expect(heatPump.value).toBe(0);
    expect(auxHeat.value).toBe(0);
    expect(fan.value).toBe(1);
  } else if (state === "HEAT") {
    expect(compressor.value).toBe(0);
    expect(heatPump.value).toBe(1);
    expect(auxHeat.value).toBe(0);
    expect(fan.value).toBe(1);
  } else if (state === "HEAT_AUX") {
    expect(compressor.value).toBe(0);
    expect(heatPump.value).toBe(1);
    expect(auxHeat.value).toBe(1);
    expect(fan.value).toBe(1);
  }
};

export const expectHVAC = (
  hvac: HVAC,
  state: HVACState,
  nextAction?: Partial<NextHVACAction>
) => {
  expect(hvac.state).toBe(state);
  if (nextAction) {
    expect(hvac.nextAction).not.toBe(null);
    if (nextAction.idleFirst !== undefined) {
      expect(hvac.nextAction?.idleFirst).toBe(nextAction.idleFirst);
    } else {
      expect(hvac.nextAction?.idleFirst).toBeUndefined();
    }

    if (nextAction.state) {
      expect(hvac.nextAction?.state).toBe(nextAction.state);
    }
  } else {
    expect(hvac.nextAction).toBeNull();
  }

  expectGPIO(hvac, state);
};
