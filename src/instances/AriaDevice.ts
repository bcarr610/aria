/**
 * Aria Device Should be the base of all devices (including the hub)
 * All members should be universal to all ARIA devices
 */

import { randomBytes } from "../utils";
import Logger from "./Logger";
import PersistentStateMachine from "./PersistentStateMachine";
import Telemetry from "./Telemetry";

class AriaDevice<T extends AriaDeviceType> {
  private deviceType: T;
  private deviceName: string;
  private deviceState: PersistentStateMachine<PersistentDeviceState>;
  telemetry: Telemetry;
  connected: boolean = false;
  logger: Logger;

  constructor(deviceType: T, deviceName: string, opts: DeviceOpts) {
    this.deviceType = deviceType;
    this.deviceName = deviceName;
    this.deviceState = new PersistentStateMachine(
      {
        deviceId: randomBytes(32),
      },
      "device_master",
      opts.deviceStateSavePath
    );
    this.telemetry = new Telemetry();
    this.logger = new Logger();
  }

  get deviceId() {
    return this.deviceState.values.deviceId;
  }

  async initialize() {
    await this.telemetry.initialize();
  }
}

export default AriaDevice;
