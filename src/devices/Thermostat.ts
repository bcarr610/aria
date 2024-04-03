import Telemetry from "../instances/Telemetry";
import AriaClientDevice from "../instances/AriaClientDevice";
import ThermostatController from "../instances/ThermostatController";
import DHTSensor from "../instances/DHTSensor";
import HVAC from "../instances/HVAC";
import root from "../root";
import PersistentStateMachine from "../instances/PersistentStateMachine";
import { randomBytes } from "../utils";

const stateFile = root.join("_g", "aria-thermostat-state.g");

const deviceState = new PersistentStateMachine<PersistentDeviceState>(
  {
    deviceId: randomBytes(32),
  },
  "device",
  stateFile
);

const dhtState = new PersistentStateMachine<DHTPersistentState>(
  {
    type: 11,
    pin: 0,
    tmpOffset: 0,
    humidityOffset: 0,
    precision: 10,
  },
  "dht",
  stateFile
);

const hvacState = new PersistentStateMachine<HVACPersistentState>(
  {
    times: {
      IDLE: { lastActive: 0, lastInactive: 0 },
      CIRCULATE: { lastActive: 0, lastInactive: 0 },
      COOL: { lastActive: 0, lastInactive: 0 },
      HEAT: { lastActive: 0, lastInactive: 0 },
      HEAT_AUX: { lastActive: 0, lastInactive: 0 },
    },
    minCycleTime: {
      unit: "MINUTES",
      value: 10,
    },
    minIdleTime: {
      unit: "MINUTES",
      value: 10,
    },
    gpioWire: {
      compressor: 1,
      fan: 2,
      heatPump: 3,
      auxHeat: 4,
    },
  },
  "hvac",
  stateFile
);

const thermostatState = new PersistentStateMachine<ThermostatPersistentState>(
  {
    target: 70,
    mode: "auto",
    energyMode: "normal",
    delaySpeedCalculation: { unit: "MINUTES", value: 15 },
    routines: [
      {
        target: 68,
        hms: [21, 0, 0],
        lastActivated: null,
        active: 1,
      },
    ],
    schedule: [],
    maxRuntime: {
      unit: "HOURS",
      value: 2,
    },
    clockSpeed: {
      unit: "MINUTES",
      value: 1,
    },
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
        for: {
          unit: "MINUTES",
          value: 10,
        },
        every: {
          unit: "HOURS",
          value: 1,
        },
      },
      normal: {
        for: {
          unit: "MINUTES",
          value: 20,
        },
        every: {
          unit: "HOURS",
          value: 1,
        },
      },
      away: {
        for: {
          unit: "MINUTES",
          value: 30,
        },
        every: {
          unit: "HOURS",
          value: 4,
        },
      },
    },
  },
  "thermostat",
  stateFile
);

// TODO, set up the hub now, set up a way to generate/store a device id, and test this using the hub
const deviceId = deviceState.values.deviceId;
const dhtSensor = new DHTSensor(dhtState);
const hvac = new HVAC(hvacState);
const thermostat = new ThermostatController(thermostatState, dhtSensor, hvac);
const telemetry = new Telemetry();
const device = new AriaClientDevice("thermostat", deviceId, "https://localhost:3000", telemetry);

thermostat.onLoad = (data) => {
  console.log("LOAD SUCCESS");
  console.log(data);
  device.emit("thermostat:data", deviceId, data);
};

thermostat.onUpdate = (data) => {
  console.log("UPDATE RECEIVED");
  console.log(data);
  device.emit("thermostat:data", deviceId, data);
};

device.on("thermostat:request:data", () => {
  device.emit("thermostat:data", deviceId, thermostat.data);
});

device.on("thermostat:set:state", (tState) => {
  thermostatState.update(tState);
});

device.on("thermostat:set:hvac", (hState) => {
  hvacState.update(hState);
});

device.on("thermostat:set:dht", (dState) => {
  dhtState.update(dState);
});
