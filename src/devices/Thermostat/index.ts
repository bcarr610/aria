import cookieParser from "cookie-parser";
import session from "express-session";
import express from "express";
import { rateLimit } from "express-rate-limit";
import { generateSessionSecret } from "../../utils/auth";
import Telemetry from "../../instances/Telemetry";
import DataStore from "../../instances/DataStore";
import { time } from "src/utils";

const sessionSecret = generateSessionSecret();
const telemetry = new Telemetry();
const stores = {
  dhtSensor: new DataStore("~/aria.instance.dht.g", {
    type: 11,
    pin: 0,
    tmpOffset: 0,
    humidityOffset: 0,
    precision: 10,
  } as unknown as DHTConfig),
  hvac: new DataStore("~/aria.instance.hvac.g", {
    times: {
      IDLE: { lastActive: 0, lastInactive: 0 },
      CIRCULATE: { lastActive: 0, lastInactive: 0 },
      COOL: { lastActive: 0, lastInactive: 0 },
      HEAT: { lastActive: 0, lastInactive: 0 },
      HEAT_AUX: { lastActive: 0, lastInactive: 0 },
    },
    minCycleTime: time(10, "MINUTES"),
    minIdleTime: time(10, "MINUTES"),
    gpioWire: {
      compressor: 1,
      fan: 2,
      heatPump: 3,
      auxHeat: 4,
    },
  } as unknown as HVACStateConfig),
  thermostat: new DataStore("~/aria.instance.thermostat.g", {
    target: 70,
    mode: "auto",
    energyMode: "normal",
    delaySpeedCalculation: time(15, "MINUTES"),
    routines: [
      {
        target: 68,
        hms: [21, 0, 0],
        lastActivated: null,
        active: 1,
      },
    ],
    schedule: [],
    maxRuntime: time(2, "HOURS"),
    clockSpeed: time(5, "SECONDS"),
    targetReachOffset: 0.4,
    auxHeat: {
      normal: {
        belowSpeed: 0.3,
        belowTempFromTarget: 10,
      },
    },
    targetPadding: {
      eco: 3,
      normal: 1,
      away: 8,
    },
    circulate: {
      eco: {
        for: time(10, "MINUTES"),
        every: time(1, "HOURS"),
      },
      normal: {
        for: time(20, "MINUTES"),
        every: time(1, "HOURS"),
      },
      away: {
        for: time(30, "MINUTES"),
        every: time(4, "HOURS"),
      },
    },
  } as unknown as ThermostatState),
};

const app = express();
