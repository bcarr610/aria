import path from "node:path";
import os from "node:os";
import AriaServer from "./instances/AriaServer/AriaServer";
import Thermostat from "./instances/Thermostat/Thermostat";
import HVAC from "./instances/HVAC/HVAC";
import hvacWireConfigurations from "./hvacWireConfigurations";
import hConfig from "../config/hvac.config.json";
import tConfig from "../config/thermostat.config.json";
import TemperatureSensor from "./instances/DHTSensor/DHTSensor";

let hvacConfig: HVACConfig;
const hvacConfigJson = hConfig as unknown as HVACConfigJson;
const thermostatConfig = tConfig as unknown as ThermostatConfig;

if (!hvacWireConfigurations[hvacConfigJson?.wireConfiguration]) {
  console.error(
    `Invalid HVAC_CONFIG.wireConfig value "${
      hvacConfigJson?.wireConfiguration
    }", acceptable values are ${Object.keys(hvacWireConfigurations)
      .map((v) => `"${v}"`)
      .join(", ")}`
  );
  process.exit(1);
} else {
  hvacConfig = {
    ...hvacConfigJson,
    controls:
      hvacWireConfigurations[hvacConfigJson.wireConfiguration](
        thermostatConfig
      ),
  };
}

const port = Number(process.env?.PORT || 4000);
global.__ROOT__ = path.resolve(__dirname, "..");
const server = new AriaServer({ protocol: "http", port });

const hvac = new HVAC(hvacConfig);
const thSensor = new TemperatureSensor(
  new GPIO("TH Sensor Data", thermostatConfig.gpio.thSensor.dataPin),
  thermostatConfig.sensors.thSensorReadIntervalSec * 1000,
  thermostatConfig.sensors.thSensorReadLength
);
const thermostat = new Thermostat(thermostatConfig, thSensor, hvac);

// const baseUrl = `${protocol}://${host}:${port}/`;

server.io.on("connection", (socket) => {
  socket.on("disconnect", (reason) => {
    console.log(`Socket disconnected: "${reason}"`);
  });

  socket.on("error", (err) => {
    // TODO Send error to hub
    console.error(err);
  });

  socket.on("set:mode", (mode) => {
    //
  });

  socket.on("set:target", (target) => {
    //
  });
});

server.start(() => {
  console.log(
    `Thermostat running at ${server.config.protocol}://${server.config.host}:${server.config.port}`
  );
});
