type PersistentDeviceState = {
  deviceId: string;
};

type ThermostatPersistentState = {
  target: number;
  mode: ThermostatMode;
  energyMode: EnergyMode;
  delaySpeedCalculation: Time;
  routines: ThermostatRoutine[];
  schedule: ThermostatScheduleItem[];
  maxRuntime: {
    unit: "HOURS";
    value: 2;
  };
  clockSpeed: Time;
  targetReachOffset: number;
  auxHeat: {
    [key in EnergyMode]?: {
      belowSpeed: number;
      belowTempFromTarget: number;
    };
  };
  targetPadding: {
    [key in EnergyMode]?: number;
  };
  circulate: {
    [key in EnergyMode]?: { for: Time; every: Time };
  };
};

type HVACPersistentState = {
  times: HVACStateTimes;
  minCycleTime: Time;
  minIdleTime: Time;
  gpioWire: {
    [key in HVACComponentName]: number;
  };
};

type DHTPersistentState = {
  type: 11 | 22;
  pin: number;
  tmpOffset: number;
  humidityOffset: number;
  precision: number;
};
