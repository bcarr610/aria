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

type ThermostatUpdateData = {
  thermostat: {
    idleSpeed: number;
    currentSpeed: number;
    state: ThermostatPersistentState;
  };
  hvac: {
    state: HVACState;
    currentState: HVACPersistentState;
    nextAction: NextHVACAction | null;
    times: HVACStateTimes;
    components: {
      [key in HVACComponentName]: boolean;
    };
  };
  dht: {
    temperature: number;
    humidity: number;
    speed: number;
    state: DHTPersistentState;
  };
};
