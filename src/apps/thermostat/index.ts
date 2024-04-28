import io, { Socket } from "socket.io-client";
import Telemetry from "../../shared/Telemetry";
import ThermostatController from "../../shared/ThermostatController";
import DHTSensor from "../../shared/DHTSensor";
import HVAC from "../../shared/HVAC";
import { strongHash } from "../../utils/auth";
import ThermostatStore from "../../stores/ThermostatStore";
import { timeToMs } from "../../utils";

const startTime = new Date().getTime();
const store = new ThermostatStore("~/astate.ag", {
  deviceId: strongHash(),
  deviceType: "thermostat",
  dht: {
    type: 11,
    pin: 0,
    tmpOffset: 0,
    humidityOffset: 0,
    precision: 2,
  },
  hvac: {
    times: {
      IDLE: {
        lastActive: startTime,
        lastInactive: startTime,
      },
      CIRCULATE: {
        lastActive: startTime,
        lastInactive: startTime,
      },
      HEAT: {
        lastActive: startTime,
        lastInactive: startTime,
      },
      COOL: {
        lastActive: startTime,
        lastInactive: startTime,
      },
      HEAT_AUX: {
        lastActive: startTime,
        lastInactive: startTime,
      },
    },
    minCycleTime: timeToMs({ unit: "MINUTES", value: 10 }),
    minIdleTime: timeToMs({ unit: "MINUTES", value: 10 }),
    gpioWire: {
      compressor: 1,
      fan: 2,
      heatPump: 3,
      auxHeat: 4,
    },
  },
  target: 70,
  mode: "auto",
  energyMode: "normal",
  delaySpeedCalculation: timeToMs({ unit: "MINUTES", value: 15 }),
  routines: [
    {
      target: 68,
      hms: [21, 0, 0],
      lastActivated: null,
      active: 1,
    },
  ],
  schedule: [],
  maxRuntime: timeToMs({
    unit: "HOURS",
    value: 2,
  }),
  clockSpeed: timeToMs({
    unit: "MINUTES",
    value: 1,
  }),
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
      for: timeToMs({
        unit: "MINUTES",
        value: 10,
      }),
      every: timeToMs({
        unit: "HOURS",
        value: 1,
      }),
    },
    normal: {
      for: timeToMs({
        unit: "MINUTES",
        value: 20,
      }),
      every: timeToMs({
        unit: "HOURS",
        value: 1,
      }),
    },
    away: {
      for: timeToMs({
        unit: "MINUTES",
        value: 30,
      }),
      every: timeToMs({
        unit: "HOURS",
        value: 4,
      }),
    },
  },
});

if (!process.env.ARIA_HUB_URL) {
  console.error(`Missing ARIA_HUB_URL environment variable`);
  process.exit(1);
}

const socket: Socket<ClientEvents, HubEvents> = io(process.env.ARIA_HUB_URL, {
  auth: {
    deviceId: store.data.deviceId,
    deviceType: store.data.deviceType,
  },
  reconnection: true,
  reconnectionDelay: 5000,
});

socket.on("connect", () => {
  const dhtSensor = new DHTSensor(
    store.dht.type,
    store.dht.pin,
    store.dht.tmpOffset,
    store.dht.humidityOffset,
    store.dht.precision
  );

  const hvac = new HVAC(
    store.hvac.gpioWire,
    store.hvac.times,
    store.hvac.minCycleTime,
    store.hvac.minIdleTime
  );

  const onThermostatData = (data: ThermostatStoreData) => {
    socket.emit("thermostat:data", data);
  };

  const thermostat = new ThermostatController(store, dhtSensor, hvac, onThermostatData);
  const telemetry = new Telemetry();

  socket.on("request:thermostat:data", () => {
    socket.emit("thermostat:data", store.data);
  });
});

socket.on("error", (err) => {
  // console.error(err);
});

socket.on("connect_error", (err) => {
  setTimeout(() => {
    socket.connect();
  }, 5000);
  console.log(err);
});

console.log("Thermostat running");
