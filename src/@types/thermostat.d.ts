type HVACWireMap = {
  Y1: number;
  G: number;
  OB: number;
  W1: number;
  W2: number;
};

type HVACControl = {
  wire: import("../enums").E_HVACWire;
  gpio: I_GPIO;
  component: import("../enums").E_HVACComponent;
  trigger: Omit<
    import("../enums").E_HVACTrigger,
    import("../enums").E_HVACTrigger.idle
  >;
};

type HVACWireConfigs = {
  "5_WIRE_STANDARD": (thermostatConfig: ThermostatConfig) => HVACControl[];
};

type HVACQueueItem = {
  trigger: import("../enums").E_HVACTrigger;
  control?: HVACControl;
  at: Date;
};

type ThermostatConfig = {
  targetOffset: number;
  tempRangeSpeedOffset: number;
  sensors: {
    thSensorReadIntervalSec: number;
    thSensorReadLength: number;
  };
  hvac: {
    idleDelaySec: number;
    circulateAirEveryMin: number;
    circulateForMin: number;
    stageSettings: {
      heat: {
        stage2: {
          nonIdleSpeedTrigger: number;
          targetOffsetTrigger: number;
          waitTimeMin: number;
        };
        emergency: {
          nonIdleSpeedTrigger: number;
          targetOffsetTrigger: number;
          waitTimeMin: number;
        };
      };
    };
  };
  gpio: {
    thSensor: {
      dataPin: number;
    };
    hvacWire: {
      Y1: number;
      G: number;
      OB: number;
      W1: number;
      W2: number;
    };
  };
};

type HVACConfigJson = {
  triggerDelayMinutes: number;
  wireConfiguration: keyof HVACWireConfigs;
};

type HVACConfig = HVACConfigJson & {
  clockSpeed: number;
  controls: HVACControl[];
};
