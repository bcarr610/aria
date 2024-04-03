type HubUrl = `${"http" | "https"}://${string}:${number}`;

type AriaDeviceType = keyof Omit<HubToClientEvents, "global"> &
  keyof Omit<ClientToHubEvents, "global">;

type ClientToHubParams<
  T extends keyof ClientToHubEvents,
  EV extends keyof ClientToHubEvents[T]
> = ClientToHubEvents[T][EV] extends (...args: any) => any
  ? Parameters<ClientToHubEvents[T][EV]>
  : any[];

interface HubToClientEvents {
  global: {
    "request:system:info": () => void;
    "request:system:stats": () => void;
  };
  thermostat: {
    "thermostat:request:data": () => void;
    "thermostat:set:state": (state: ThermostatPersistentState) => void;
    "thermostat:set:hvac": (hvac: HVACPersistentState) => void;
    "thermostat:set:dht": (dht: DHTPersistentState) => void;
  };
}

interface ClientToHubEvents {
  global: {
    error: (device: string, err: Error) => void;
    "system:info": (device: string, info: SystemInfo | null) => void;
    "system:telemetry": (device: string, data: TelemetryStats) => void;
    "device:ready": (device: string, info: SystemInfo) => void;
  };
  thermostat: {
    "thermostat:data": (device: string, data: ThermostatUpdateData) => void;
  };
}

interface InterWSEvents {
  ping: () => void;
}

interface WSData {
  name: string;
  age: number;
}
