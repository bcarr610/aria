type HVACState = "IDLE" | "CIRCULATE" | "COOL" | "HEAT" | "HEAT_AUX";
type ThermostatMode = "auto" | HVACState;
type HVACComponentName = "heatPump" | "compressor" | "auxHeat" | "fan";
type TimeUnit = "DAYS" | "HOURS" | "MINUTES" | "SECONDS" | "MILLISECONDS";
type EnergyMode = "away" | "eco" | "normal";

type NextHVACAction = {
  idleFirst: boolean;
  state: HVACState;
  at: Date;
};

type HVACComponents = {
  [key in HVACComponentName]: import("../instances/GPIO/GPIO").default;
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

type ThermostatScheduleItem = {
  target: number;
  time: Date;
};

type Time = {
  unit: TimeUnit;
  value: number;
};

type NextTarget = {
  to: number;
  at: Date;
};

type HVACStateTimes = {
  [key in HVACState]: {
    lastActive: Date;
    lastInactive: Date;
  };
};

type HVACUpdateData = {
  state: HVACState;
  nextAction: NextHVACAction | null;
  times: HVACStateTimes;
  components: {
    [key in HVACComponentName]: {
      lastActiveTime: Date;
      lastInactiveTime: Date;
      isActive: boolean;
    };
  };
};

type DHTUpdateData = {
  temperature: number;
  humidity: number;
  speed: number;
};
