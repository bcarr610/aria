const config: { [key in AriaDeviceType]: DeviceConfiguration } = {
  hub: {
    canConnectToHub: true,
    canReadTelemetry: true,
    canAuthorizeNewDevice: true,
    canReadLogs: true,
  },
  window: {
    canConnectToHub: true,
    canReadTelemetry: true,
    canAuthorizeNewDevice: true,
    canReadLogs: true,
  },
  thermostat: {
    canConnectToHub: true,
    canReadTelemetry: false,
    canAuthorizeNewDevice: false,
    canReadLogs: false,
  },
};

export default config;
