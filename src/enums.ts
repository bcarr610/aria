export enum E_ThermostatMode {
  auto,
  off,
  fan,
  cool,
  heat,
  heatStage2,
  emergencyHeat,
}

export enum E_HVACState {
  startingIdle,
  idle,
  startingToCool,
  cooling,
  startingFan,
  blowing,
  startingHeat,
  heating,
  startingHeatStage2,
  heatingStage2,
  startingEmergencyHeat,
  heatingEmergency,
}

export enum E_HVACTrigger {
  idle,
  cool,
  fan,
  heat,
  heatStage2,
  heatEmergency,
}

export enum E_HVACComponent {
  COOLING,
  HEAT_PUMP,
  HEAT_STAGE_2,
  EMERGENCY_HEAT,
  FAN,
}

export enum E_HVACWire {
  Y1,
  G,
  OB,
  W1,
  W2,
}
