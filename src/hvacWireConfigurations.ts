import { E_HVACComponent, E_HVACTrigger, E_HVACWire } from "./enums";
import thermostatConfig from "../config/thermostat.config.json";
import GPIO from "./instances/GPIO";

const tconfig: ThermostatConfig = thermostatConfig;
const {
  gpio: { hvacWire },
} = tconfig;

const c_5wireStandard = (thermostatConfig: ThermostatConfig): HVACControl[] => [
  {
    wire: E_HVACWire.Y1,
    gpio: new GPIO(thermostatConfig.gpio.hvacWire.Y1, "out"),
    component: E_HVACComponent.COOLING,
    trigger: E_HVACTrigger.cool,
  },
  {
    wire: E_HVACWire.G,
    gpio: new GPIO(thermostatConfig.gpio.hvacWire.G, "out"),
    component: E_HVACComponent.FAN,
    trigger: E_HVACTrigger.fan,
  },
  {
    wire: E_HVACWire.OB,
    gpio: new GPIO(thermostatConfig.gpio.hvacWire.OB, "out"),
    component: E_HVACComponent.HEAT_PUMP,
    trigger: E_HVACTrigger.heat,
  },
  {
    wire: E_HVACWire.W1,
    gpio: new GPIO(thermostatConfig.gpio.hvacWire.W1, "out"),
    component: E_HVACComponent.HEAT_STAGE_2,
    trigger: E_HVACTrigger.heatStage2,
  },
  {
    wire: E_HVACWire.W2,
    gpio: new GPIO(thermostatConfig.gpio.hvacWire.W2, "out"),
    component: E_HVACComponent.EMERGENCY_HEAT,
    trigger: E_HVACTrigger.heatEmergency,
  },
];

const hvacWireConfigs: HVACWireConfigs = {
  "5_WIRE_STANDARD": c_5wireStandard,
};

export default hvacWireConfigs;
