type HubUrl = `${"http" | "https"}://${string}:${number}`;

type AriaHeaders = {
  "X-User-Session-Token": UserSessionToken;
};

// type HubToClientParams<
//   T extends keyof HubEvents,
//   EV extends keyof HubEvents[T]
// > = HubEvents[T][EV] extends (...args: any) => any ? Parameters<HubEvents[T][EV]> : any[];

// type ClientToHubParams<EV extends keyof AllClientEvents> = AllClientEvents[EV] extends (
//   ...args: any
// ) => any
//   ? Parameters<AllClientEvents[EV]>
//   : any[];

// type SharedClientEvents = {};

// type SharedHubEvents = {
//   error: (err: Error) => void;
//   "system:info": (info: SystemInfo | null) => void;
//   "system:stats": (data: TelemetryStats) => void;
//   "device:ready": (info: SystemInfo) => void;
// };

// type NonWindowClientEvents = Omit<ClientEvents, "window">;
// type NonWindowHubEvents = Omit<HubEvents, "window">;

// type WindowHubEvents = {
//   [K in keyof NonWindowClientEvents]: {
//     [E in keyof NonWindowClientEvents[K]]: NonWindowClientEvents[K][E] extends (
//       ...args: any[]
//     ) => any
//       ? (deviceId: string, ...args: Parameters<NonWindowClientEvents[K][E]>) => void
//       : never;
//   };
// }[keyof NonWindowClientEvents];

// type WindowClientEvents = {
//   [K in keyof NonWindowHubEvents]: {
//     [E in keyof NonWindowHubEvents[K]]: NonWindowHubEvents[K][E] extends (...args: any[]) => any
//       ? (deviceId: string, ...args: Parameters<NonWindowHubEvents[K][E]>) => void
//       : never;
//   };
// }[keyof NonWindowHubEvents];

// type AllHubEvents = {
//   [K in keyof HubEvents]: {
//     [E in keyof HubEvents[K]]: HubEvents[K][E] extends (...args: any[]) => any
//       ? (...args: Parameters<HubEvents[K][E]>) => void
//       : never;
//   };
// }[keyof HubEvents];

// type AllClientEvents = {
//   [K in keyof ClientEvents]: {
//     [E in keyof ClientEvents[K]]: ClientEvents[K][E] extends (...args: any[]) => any
//       ? (...args: Parameters<ClientEvents[K][E]>) => void
//       : never;
//   };
// }[keyof ClientEvents];

// type HubEvents = {
//   window: SharedHubEvents & WindowHubEvents;
//   thermostat: SharedHubEvents & {
//     "thermostat:data": (data: ThermostatUpdateData) => void;
//   };
// };

// type ClientEvents = {
//   window: SharedClientEvents & WindowClientEvents;
//   thermostat: SharedClientEvents & {
//     "request:thermostat:data": () => void;
//     "thermostat:set:state": (state: ThermostatPersistentState) => void;
//     "thermostat:set:hvac": (hvac: HVACPersistentState) => void;
//     "thermostat:set:dht": (dht: DHTPersistentState) => void;
//   };
// };

// interface InterWSEvents {
//   ping: () => void;
// }

// interface WSData {
//   name: string;
//   age: number;
// }
