import { E_HVACTrigger } from "../enums";
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

export const getHvacPinValues = (hvac: HVAC): (1 | 0)[] => {
  return hvac.config.controls.map((v) => v.gpio.readSync());
};

export const softDateNum = (date: Date): number => date.getTime() / 60000;

export const targetHvacWireGpio = (
  activeTrigger: E_HVACTrigger,
  controls: HVACControl[]
): number[] => {
  const foundIndex = controls.findIndex((f) => f.trigger === activeTrigger);
  const out = controls.map((v) => 0);
  if (activeTrigger !== E_HVACTrigger.idle && foundIndex !== -1) {
    out[foundIndex] = 1;
  }
  return out;
};
