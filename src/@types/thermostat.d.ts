type HVACState = "IDLE" | "CIRCULATE" | "COOL" | "HEAT" | "HEAT_AUX";
type ThermostatMode = "auto" | HVACState;
type HVACComponentName = "heatPump" | "compressor" | "auxHeat" | "fan";
type TimeUnit = "DAYS" | "HOURS" | "MINUTES" | "SECONDS" | "MILLISECONDS";
type EnergyMode = "away" | "eco" | "normal";

type NextHVACAction = {
  idleFirst: boolean;
  state: HVACState;
  at: number;
};

type HVACGpioWires = {
  [key in HVACComponentName]: number;
};

type HVACComponents = {
  [key in HVACComponentName]: import("../shared/GPIO/GPIO").default;
};

type ThermostatOptions = {
  clockSpeed: Time;
  targetReachOffset: number;
  delaySpeedCalculation: Time;
  auxHeatSpeedBelow: number;
  auxHeatTempFromTargetBelow: number;
  targetPadding: number;
  circulateFor: Time;
  circulateEvery: Time;
};

type ThermostatRoutine = {
  target?: number;
  energyMode?: EnergyMode;
  hms: HMS;
  lastActivated: MDY | null;
  active: 0 | 1;
};

type ThermostatScheduleItem = {
  target: number;
  time: number;
};

type Time = {
  unit: TimeUnit;
  value: number;
};

type NextTarget = {
  to: number;
  at: number;
};

type HVACStateTimes = {
  [key in HVACState]: {
    lastActive: number;
    lastInactive: number;
  };
};
