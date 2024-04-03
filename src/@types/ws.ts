type HubUrl = `${"http" | "https"}://${string}:${number}`;

// type DeviceEventMap<T extends AriaDeviceType> = T extends "thermostat"
//   ? ThermostatEvents
//   : T extends "window"
//   ? WindowEvents
//   : {};

type HubToClientParams<
  T extends keyof HubEvents,
  EV extends keyof HubEvents[T]
> = HubEvents[T][EV] extends (...args: any) => any ? Parameters<HubEvents[T][EV]> : any[];

// TODO Clean this up after thermostat, hub and window deployed to make more modular

type SharedClientEvents = {
  "request:system:info": () => void;
  "request:system:stats": () => void;
};

type SharedHubEvents = {
  error: (device: string, err: Error) => void;
  "system:info": (device: string, info: SystemInfo | null) => void;
  "system:stats": (device: string, data: TelemetryStats) => void;
  "device:ready": (device: string, info: SystemInfo) => void;
};

type WindowEvents = {
  [K in keyof ClientDeviceEvents]: {
    [E in keyof ClientDeviceEvents[K]]: ClientDeviceEvents[K][E] extends (...args: any[]) => any
      ? (deviceId: string, ...args: Parameters<ClientDeviceEvents[K][E]>) => void
      : never;
  };
}[keyof ClientDeviceEvents];

type HubEvents = {
  thermostat: {
    "thermostat:data": (device: string, data: ThermostatUpdateData) => void;
  };
};

type ClientDeviceEvents = {
  thermostat: {
    "request:thermostat:data": () => void;
    "thermostat:set:state": (state: ThermostatPersistentState) => void;
    "thermostat:set:hvac": (hvac: HVACPersistentState) => void;
    "thermostat:set:dht": (dht: DHTPersistentState) => void;
  };
};

interface InterWSEvents {
  ping: () => void;
}

interface WSData {
  name: string;
  age: number;
}
