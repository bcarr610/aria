import os from "node:os";
import * as utils from "./utils";
import { E_HVACTrigger, E_ThermostatMode } from "../enums";

describe("utils", () => {
  describe("getHost", () => {
    const test = utils.getHost();
    expect(typeof test).toBe("string");
  });

  describe("getTriggerFromMode", () => {
    it("Should return cool", () => {
      const mode = E_ThermostatMode.cool;
      const test = utils.getTriggerFromMode(mode);
      const expected = E_HVACTrigger.cool;
      expect(test).toBe(expected);
    });

    it("Should return fan", () => {
      const mode = E_ThermostatMode.fan;
      const test = utils.getTriggerFromMode(mode);
      const expected = E_HVACTrigger.fan;
      expect(test).toBe(expected);
    });

    it("Should return heat", () => {
      const mode = E_ThermostatMode.heat;
      const test = utils.getTriggerFromMode(mode);
      const expected = E_HVACTrigger.heat;
      expect(test).toBe(expected);
    });

    it("Should return heat stage 2", () => {
      const mode = E_ThermostatMode.heatStage2;
      const test = utils.getTriggerFromMode(mode);
      const expected = E_HVACTrigger.heatStage2;
      expect(test).toBe(expected);
    });

    it("Should return emergency heat", () => {
      const mode = E_ThermostatMode.emergencyHeat;
      const test = utils.getTriggerFromMode(mode);
      const expected = E_HVACTrigger.heatEmergency;
      expect(test).toBe(expected);
    });

    it("Should return idle", () => {
      const mode = E_ThermostatMode.cool;
      const test1 = utils.getTriggerFromMode(E_ThermostatMode.off);
      const test2 = utils.getTriggerFromMode(-1 as unknown as E_ThermostatMode);
      const expected = E_HVACTrigger.idle;
      expect(test1).toBe(expected);
      expect(test2).toBe(expected);
    });
  });

  describe("calculateTemperatureChangeSpeedPerHour", () => {
    it("Should calculate correct degree change per hour", () => {
      const test = utils.calculateTemperatureChangeSpeedPerHour(1, 70, 70.1);
      expect(test).toBeCloseTo(360);
    });
  });
});
