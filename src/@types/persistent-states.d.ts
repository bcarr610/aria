type PersistentDeviceState = {
  deviceId: string;
  deviceType: keyof ClientEvents | keyof HubEvents | "hub";
  deviceName: string;
};

type PersistentClientState = {
  token: string;
  lastHubConnection: number | null;
};

type PersistentHubState = {
  token: string;
  devices: RegisteredDevice[];
};
