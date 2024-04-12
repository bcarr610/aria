/**
 * Aria Device Should be the base of all devices (including the hub)
 * All members should be universal to all ARIA devices
 */

import { randomBytes } from "../utils";
import Logger from "./Logger";
import PersistentStateMachine from "./PersistentStateMachine";
import Telemetry from "./Telemetry";

class AriaDevice<T extends keyof ClientEvents | keyof HubEvents | "hub"> {
  deviceType: T;
  deviceName: string;
  deviceState: PersistentStateMachine<PersistentDeviceState>;
  telemetry: Telemetry;
  connected: boolean = false;
  logger: Logger;

  constructor(deviceType: T, deviceName: string, opts: DeviceOpts) {
    this.deviceType = deviceType;
    this.deviceName = deviceName;
    this.deviceState = new PersistentStateMachine(
      {
        deviceId: randomBytes(32),
        deviceType: this.deviceType,
        deviceName: this.deviceName,
      },
      "device",
      opts.deviceStateSavePath
    );
    this.telemetry = new Telemetry();
    this.logger = new Logger();
  }

  get deviceId() {
    return this.deviceState.values.deviceId;
  }

  async initializeDevice() {
    await this.telemetry.initialize();
  }
}

export default AriaDevice;
