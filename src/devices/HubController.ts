// TODO build HubController (This is not the hub, this is the web client that controls the hub)

import socket, { Socket } from "socket.io-client";
import AriaDevice from "src/instances/AriaDevice";

class HubController<T extends AriaDeviceType> extends AriaDevice<T> {
  private socketId: string | undefined;
  private socket: Socket<
    ClientToHubEvents["hubController"] & ClientToHubEvents["thermostat"],
    HubToClientEvents[keyof HubToClientEvents]
  >;

  constructor(deviceType: T, deviceName: string, opts: ClientDeviceArgs) {
    super(deviceType, deviceName, opts);
    this.socket = socket(opts.hubUrl);
    this.socketId = this.socket.id;

    this.socket.on("connect", () => {
      this.socketId = this.socket.id;
      this.connected = true;
      this.logger.info(`${this.deviceId} Connected`);
    });

    this.socket.on("connect_error", (err) => {
      this.logger.error(`Socket Connect Error`, err);
    });

    this.socket.on("disconnect", (reason) => {
      this.connected = false;
      this.logger.info(`${this.deviceId} Disconnected`);
    });

    this.socket.on("error", (deviceId, err) => {});
  }

  on<EV extends keyof ClientToHubEvents[T]>(ev: EV, listener: ClientToHubEvents[T][EV]) {
    this.socket.on(ev as any, listener as any);
  }

  emit<EV extends keyof HubToClientEvents[T]>(ev: EV, ...args: HubToClientParams<T, EV>) {
    this.socket.emit(ev as any, ...(args as any));
  }
}

export default HubController;
