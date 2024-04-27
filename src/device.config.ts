const config: { [key in Exclude<AriaDeviceType, "hub">]: DeviceConfiguration } = {
  window: {
    comRooms: ["managers"],
    canRemoveDevices: true,
    canConnectToHub: true,
    canReadTelemetry: true,
    canAuthorizeNewDevice: true,
    canUpdateDevices: true,
    canDeleteDevices: true,
    canReadLogs: true,
    canViewDevices: true,
  },
  thermostat: {
    comRooms: [],
    canRemoveDevices: false,
    canConnectToHub: true,
    canReadTelemetry: false,
    canAuthorizeNewDevice: false,
    canUpdateDevices: false,
    canDeleteDevices: false,
    canReadLogs: false,
    canViewDevices: false,
  },
  control_center: {
    comRooms: ["managers"],
    canRemoveDevices: true,
    canConnectToHub: true,
    canReadTelemetry: true,
    canAuthorizeNewDevice: true,
    canUpdateDevices: true,
    canDeleteDevices: true,
    canReadLogs: true,
    canViewDevices: true,
  },
};

export default config;
