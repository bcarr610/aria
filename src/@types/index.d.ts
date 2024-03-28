interface AriaSharedEventManager {
  onServerListenStart(server: I_AriaServer): void;
  onSocketConnect(): void;
  onSocketDisconnect(): void;
  onSocketError(): void;
}

type Runtime = "production" | "development" | "remote";

type DHTSensorReading = {
  temperature: number;
  humidity: number;
  at: Date;
};

interface I_AriaServer {
  app: import("express").Application;
  server: import("node:http").Server;
  io: import("socket.io").Server;
  config: AriaServerConfig;

  start(): void;
}

interface AriaServerConfig {
  protocol: "http" | "https";
  host: string;
  port: number;
}

type AriaEventName = "ARIA";
type ThermostatEventName = "THERMOSTAT";
type ThermostatEvent =
  | "TEMP_CHANGE"
  | "SPEED_CHANGE"
  | "HVAC_CHANGE"
  | "SCHEDULE_START";

interface ThermostatToHubEvents {
  "target:change": (target: number) => void;
  "temp:change": (temp: number) => void;
}

interface HubToThermostatEvents {
  "set:target": (target: number) => void;
}

interface InterThermostatEvents {
  ping: () => void;
}

interface SocketData {
  name: string;
  age: number;
}
