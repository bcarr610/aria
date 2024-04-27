type UpdateDeviceData = {
  type: Exclude<AriaDeviceType, "hub">;
  name: string;
  room: string | null;
  groups: string[];
  favorite: boolean;
  registrationState: "pending" | "registered";
  address: string;
  port: number;
};

type HubUrl = `${"http" | "https"}://${string}:${number}`;

type SharedEvents = {
  success: () => void;
  fail: (err: Error) => void;
  error: (err: Error) => void;
  "system:info": (info: SystemInfo | null) => void;
  "system:stats": (data: TelemetryStats) => void;
};

type WindowEvents = {
  devices: (devices: DeviceData[]) => void;
  connections: (deviceIds: string[]) => void;
};

type HubEvents = SharedEvents & {
  // From Manager Clients
  "device:set": (deviceId: string, data: Partial<UpdateDeviceData>) => void;
  "device:register": (deviceId: string) => void;
  "device:remove": (deviceId: string) => void;

  // Device Events
  "thermostat:data": (data: ThermostatStoreData) => void;
};

type ClientEvents = SharedEvents &
  WindowEvents & {
    "request:thermostat:data": () => void;
    "thermostat:set:state": (state: ThermostatStoreData) => void;
    "thermostat:set:hvac": (hvac: ThermostatStoreData) => void;
    "thermostat:set:dht": (dht: ThermostatStoreData) => void;
  };

interface InterWSEvents {
  ping: () => void;
}

interface HubSocketData {
  device: import("../stores/DeviceStore").Device;
}
