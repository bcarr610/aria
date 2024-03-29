import GPIO from "../GPIO/GPIO";
import HVAC from "../HVAC/HVAC";
import DHTSensor from "../DHTSensor/DHTSensor";
import Thermostat from "./Thermostat";
import { timeToMs, wait } from "../../utils";

const preferences: ThermostatConfig["preferences"] = {
  energyMode: "normal",
  auxHeat: {
    normal: {
      belowSpeed: 0.5,
      belowTempFromTarget: 10,
    },
  },
  targetPadding: {
    normal: 1,
  },
  circulate: {
    normal: {
      for: {
        unit: "MILLISECONDS",
        value: 10,
      },
      every: {
        unit: "MILLISECONDS",
        value: 15,
      },
    },
  },
  maxRuntime: {
    unit: "MILLISECONDS",
    value: 50,
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
  thermostat = new Thermostat(
    dhtSensor,
    hvac,
    { unit: "MILLISECONDS", value: 10 },
    { unit: "MILLISECONDS", value: 10 },
    0.4,
    preferences
  );
});

describe("Thermostat.constructor", () => {
  it("Should construct with defaults", () => {
    thermostat = new Thermostat(
      dhtSensor,
      hvac,
      { unit: "MILLISECONDS", value: 10 },
      { unit: "MILLISECONDS", value: 11 },
      0.4
    );
    expect(thermostat["clockSpeed"]).toBe(10);
    expect(thermostat["targetReachOffset"]).toBe(0.4);
    expect(thermostat["delaySpeedCalculation"]).toBe(11);
    expect(thermostat["auxHeat"]["belowSpeed"]).toBe(0.2);
    expect(thermostat["auxHeat"]["belowTempFromTarget"]).toBe(10);
    expect(thermostat["targetPadding"]).toBe(1);
    expect(thermostat["circulateFor"]).toBe(
      timeToMs({ unit: "MINUTES", value: 10 })
    );
    expect(thermostat["circulateEvery"]).toBe(
      timeToMs({ unit: "MINUTES", value: 30 })
    );
  });

  it("Should construct with supplied options", () => {
    expect(thermostat["clockSpeed"]).toBe(10);
    expect(thermostat["targetReachOffset"]).toBe(0.4);
    expect(thermostat["delaySpeedCalculation"]).toBe(10);
    expect(thermostat["auxHeat"]["belowSpeed"]).toBe(
      preferences.auxHeat.normal?.belowSpeed
    );
    expect(thermostat["auxHeat"]["belowTempFromTarget"]).toBe(
      preferences.auxHeat.normal?.belowTempFromTarget
    );
    expect(thermostat["targetPadding"]).toBe(preferences.targetPadding.normal);
    expect(thermostat["circulateFor"]).toBe(
      timeToMs(
        preferences.circulate.normal?.for ?? { unit: "MILLISECONDS", value: 10 }
      )
    );
    expect(thermostat["circulateEvery"]).toBe(
      timeToMs(
        preferences.circulate.normal?.every ?? {
          unit: "MILLISECONDS",
          value: 10,
        }
      )
    );
  });
});

describe("Thermostat.mode", () => {
  it("Should set", () => {
    thermostat.mode = "COOL";
    expect(hvac.state).toBe("IDLE");
    expect(hvac.nextAction?.state).toBe("COOL");
  });
  it("Should get", () => {
    expect(thermostat.mode).toBe("auto");
  });
});

describe("Thermostat.target", () => {
  it("Should set", () => {
    thermostat.target = 40;
    expect(thermostat.target).toBe(thermostat["_target"]);
    thermostat.target = 74;
    expect(thermostat.target).toBe(74);
  });
  it("Should get", () => {
    expect(thermostat.target).toBe(thermostat["_target"]);
  });
});

describe("Thermostat.isSpeedStable", () => {
  it("Should return correct boolean after delay speed calculations", async () => {
    expect(thermostat.isSpeedStable).toBe(false);
    await wait(11);
    expect(thermostat.isSpeedStable).toBe(true);
  });
});

describe("Thermostat.preferredAction", () => {
  it("Should return null if speed not stable", async () => {
    thermostat.target = 78;
    expect(thermostat.preferredAction).toBeNull();
  });

  it("Should return heat", async () => {
    thermostat.target = 76;
    await wait(11);
    expect(thermostat.preferredAction).toBe("HEAT");
  });

  it("Should return auxHeat while idle", async () => {
    thermostat["dhtSensor"].avgTemp = 60;
    thermostat["auxHeat"]["belowTempFromTarget"] = 10;
    thermostat.target = 70;
    await wait(11);
    expect(thermostat.preferredAction).toBe("HEAT_AUX");
  });

  it("Should return auxHeat when heating slowly", async () => {
    thermostat["dhtSensor"].avgTemp = 68;
    thermostat["auxHeat"]["belowSpeed"] = 1;
    thermostat["currentSpeed"] = 0.8;
    thermostat.target = 74;
    hvac.queue("HEAT");
    hvac.clock();
    await wait(hvac["transitionTime"] + 1);
    hvac.clock();
    expect(hvac.state).toBe("HEAT");
    expect(thermostat.preferredAction).toBeNull();
    await wait(11);
    expect(thermostat.preferredAction).toBe("HEAT_AUX");
  });

  it("Should return cool", async () => {
    thermostat["dhtSensor"].avgTemp = 75;
    thermostat.target = 70;
    await wait(11);
    expect(thermostat.preferredAction).toBe("COOL");
  });

  it("Should return circulate", async () => {
    thermostat["dhtSensor"].avgTemp = 70;
    thermostat.target = 71;
    expect(thermostat.preferredAction).toBeNull();
    await wait(
      timeToMs(
        preferences?.circulate?.normal?.every ?? {
          unit: "MILLISECONDS",
          value: 10,
        }
      ) + 1
    );
    expect(thermostat.preferredAction).toBe("CIRCULATE");
  });

  it("Should return idle when circulating", async () => {
    thermostat["hvac"]["circulate"]();
    thermostat["hvac"].clock();
    await wait(
      timeToMs(
        preferences?.circulate?.normal?.for ?? {
          unit: "MILLISECONDS",
          value: 10,
        }
      ) + 1
    );
    expect(thermostat.preferredAction).toBe("IDLE");
  });

  it("Should return idle when heating", async () => {
    thermostat["auxHeat"]["belowSpeed"] = 1;
    thermostat["currentSpeed"] = 2;
    thermostat["hvac"]["heat"]();
    thermostat["hvac"].clock();
    await wait(11);
    thermostat.target = 72;
    thermostat["dhtSensor"].avgTemp = 72;
    expect(thermostat.preferredAction).toBeNull();
    thermostat["dhtSensor"].avgTemp = 72 + 0.4;
    expect(thermostat.preferredAction).toBe("IDLE");
  });

  it("Should return idle when cooling", async () => {
    thermostat["hvac"]["cool"]();
    thermostat["hvac"].clock();
    await wait(11);
    thermostat.target = 72;
    thermostat["dhtSensor"].avgTemp = 72;
    expect(thermostat.preferredAction).toBeNull();
    thermostat["dhtSensor"].avgTemp = 72 - 0.4;
    expect(thermostat.preferredAction).toBe("IDLE");
  });

  it("Should go idle after max runtime reached", async () => {
    thermostat["hvac"]["heat"]();
    thermostat.target = 76;
    expect(thermostat.preferredAction).toBeNull();
    await wait(55);
    expect(thermostat.preferredAction).toBe("IDLE");
  });
});

describe("Thermostat.tick", () => {
  it("Should set idle speed when idle and speed is stable", async () => {});
  it("Should set current speed when speed stable", async () => {});
  it("Should queue preferred action when mode is auto", async () => {});
  it("Should queue, manual modes", async () => {});
});
