type StoreData = {
  deviceId: string;
  deviceType: AriaDeviceType;
};

type ThermostatStoreData = StoreData & {
  dht: {
    type: 11 | 22;
    pin: number;
    tmpOffset: number;
    humidityOffset: number;
    precision: number;
  };
  hvac: {
    times: HVACStateTimes;
    minCycleTime: number;
    minIdleTime: number;
    gpioWire: HVACGpioWires;
  };
  target: number;
  mode: ThermostatMode;
  energyMode: EnergyMode;
  delaySpeedCalculation: number;
  routines: ThermostatRoutine[];
  schedule: ThermostatScheduleItem[];
  maxRuntime: number;
  clockSpeed: number;
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
    [key in EnergyMode]?: { for: number; every: number };
  };
};
