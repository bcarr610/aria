type AuxHeatSettings = {
  belowSpeed?: number;
  belowTempFromTarget?: number;
};

type ThermostatConfig = {
  hvac: {
    minCycleTime: Time;
    minIdleTime: Time;
  };
  gpio: {
    dhtPin: number;
    hvac: {
      [key in HVACComponentName]: number;
    };
  };
  parameters: {
    dhtTempReadingOffset: number;
    dhtHumidReadingOffset: number;
    dhtPrecision: number;
    delaySpeedCalculation: Time;
    clockSpeed: Time;
    targetReachOffset: number;
  };
  preferences: {
    energyMode: EnergyMode;
    auxHeat: {
      [key in EnergyMode]?: AuxHeatSettings;
    };
    targetPadding: {
      [key in EnergyMode]?: number;
    };
    circulate: {
      [key in EnergyMode]?: { for?: Time; every?: Time };
    };
    maxRuntime: Time; // TODO IMPLEMENT MAX RUNTIME ON HVAC CLASS
  };
};
