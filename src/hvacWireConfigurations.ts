import { E_HVACComponent, E_HVACTrigger, E_HVACWire } from "./enums";
import thermostatConfig from "../config/thermostat.config.json";

const tconfig: ThermostatConfig = thermostatConfig;
const {
  gpio: { hvacWire },
} = tconfig;

const c_5wireStandard = (thermostatConfig: ThermostatConfig): HVACControl[] => [
  {
    wire: E_HVACWire.Y1,
    gpio: new GPIO("Cooling Wire", thermostatConfig.gpio.hvacWire.Y1),
    component: E_HVACComponent.COOLING,
    trigger: E_HVACTrigger.cool,
  },
  {
    wire: E_HVACWire.G,
    gpio: new GPIO("Fan Wire", thermostatConfig.gpio.hvacWire.G),
    component: E_HVACComponent.FAN,
    trigger: E_HVACTrigger.fan,
  },
  {
    wire: E_HVACWire.OB,
    gpio: new GPIO("Heat Pump Wire", thermostatConfig.gpio.hvacWire.OB),
    component: E_HVACComponent.HEAT_PUMP,
    trigger: E_HVACTrigger.heat,
  },
  {
    wire: E_HVACWire.W1,
    gpio: new GPIO("Heat Stage 2 Wire", thermostatConfig.gpio.hvacWire.W1),
    component: E_HVACComponent.HEAT_STAGE_2,
    trigger: E_HVACTrigger.heatStage2,
  },
  {
    wire: E_HVACWire.W2,
    gpio: new GPIO("Emergency Heat Wire", thermostatConfig.gpio.hvacWire.W2),
    component: E_HVACComponent.EMERGENCY_HEAT,
    trigger: E_HVACTrigger.heatEmergency,
  },
];

const hvacWireConfigs: HVACWireConfigs = {
  "5_WIRE_STANDARD": c_5wireStandard,
};

export default hvacWireConfigs;
