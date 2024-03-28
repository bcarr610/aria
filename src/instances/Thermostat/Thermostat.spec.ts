import GPIO from "../GPIO/GPIO";
import HVAC from "../HVAC/HVAC";
import DHTSensor from "../DHTSensor/DHTSensor";
import Thermostat, { defaultOpts } from "./Thermostat";
import { timeToMs } from "../../utils";

const opts: ThermostatOptions = {
  clockSpeed: {
    unit: "MILLISECONDS",
    value: 1,
  },
  targetReachOffset: 0.4,
  delaySpeedCalculation: {
    unit: "MILLISECONDS",
    value: 10,
  },
  auxHeatSpeedBelow: 0.5,
  auxHeatTempFromTargetBelow: 8,
  targetPadding: 1,
  circulateFor: {
    unit: "MILLISECONDS",
    value: 10,
  },
  circulateEvery: {
    unit: "MILLISECONDS",
    value: 20,
  },
};

let compressor: GPIO;
let heatPump: GPIO;
let auxHeat: GPIO;
let fan: GPIO;
let hvac: HVAC;
let dhtSensor: DHTSensor;
let thermostat: Thermostat;

beforeEach(() => {
  compressor = new GPIO(0);
  heatPump = new GPIO(1);
  auxHeat = new GPIO(2);
  fan = new GPIO(3);
  hvac = new HVAC(3, 6, compressor, heatPump, auxHeat, fan);
  dhtSensor = new DHTSensor(11, 4, 5);
  thermostat = new Thermostat(dhtSensor, hvac, null, opts);
});

describe("Thermostat.constructor", () => {
  it("Should construct with defaults", () => {
    const {
      clockSpeed,
      targetReachOffset,
      delaySpeedCalculation,
      auxHeatSpeedBelow,
      auxHeatTempFromTargetBelow,
      targetPadding,
      circulateFor,
      circulateEvery,
    } = defaultOpts;
    thermostat = new Thermostat(dhtSensor, hvac);
    expect(thermostat["clockSpeed"]).toBe(timeToMs(clockSpeed));
    expect(thermostat["targetReachOffset"]).toBe(targetReachOffset);
    expect(thermostat["delaySpeedCalculation"]).toBe(
      timeToMs(delaySpeedCalculation)
    );
    expect(thermostat["auxHeatSpeedBelow"]).toBe(auxHeatSpeedBelow);
    expect(thermostat["auxHeatTempFromTargetBelow"]).toBe(
      auxHeatTempFromTargetBelow
    );
    expect(thermostat["targetPadding"]).toBe(targetPadding);
    expect(thermostat["circulateFor"]).toBe(timeToMs(circulateFor));
    expect(thermostat["circulateEvery"]).toBe(timeToMs(circulateEvery));
  });

  it("Should construct with supplied options", () => {
    const {
      clockSpeed,
      targetReachOffset,
      delaySpeedCalculation,
      auxHeatSpeedBelow,
      auxHeatTempFromTargetBelow,
      targetPadding,
      circulateFor,
      circulateEvery,
    } = opts;
    expect(thermostat["clockSpeed"]).toBe(timeToMs(clockSpeed));
    expect(thermostat["targetReachOffset"]).toBe(targetReachOffset);
    expect(thermostat["delaySpeedCalculation"]).toBe(
      timeToMs(delaySpeedCalculation)
    );
    expect(thermostat["auxHeatSpeedBelow"]).toBe(auxHeatSpeedBelow);
    expect(thermostat["auxHeatTempFromTargetBelow"]).toBe(
      auxHeatTempFromTargetBelow
    );
    expect(thermostat["targetPadding"]).toBe(targetPadding);
    expect(thermostat["circulateFor"]).toBe(timeToMs(circulateFor));
    expect(thermostat["circulateEvery"]).toBe(timeToMs(circulateEvery));
  });
});

describe("Thermostat.mode", () => {
  it("Should set", () => {});
  it("Should get", () => {});
});

describe("Thermostat.target", () => {
  it("Should set", () => {});
  it("Should get", () => {});
});

describe("Thermostat.isSpeedStable", () => {
  it("Should return correct boolean after delay speed calculations", () => {});
});
