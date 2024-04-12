type DeviceOpts = {
  deviceStateSavePath: string;
};

type ClientDeviceArgs = DeviceOpts & {
  hubUrl: HubUrl;
  ports: {
    client: number;
    hub: number;
  };
};

type HubDeviceArgs = DeviceOpts & {
  port: number;
};
