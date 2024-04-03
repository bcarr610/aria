import socket, { Socket } from "socket.io-client";
import AriaDevice from "./AriaDevice";

class HubClient<T extends keyof ClientDeviceEvents> extends AriaDevice<T> {
  private socketId: string | undefined;
  private socket: Socket<SharedClientEvents, SharedHubEvents>;

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

    this.socket.on("request:system:info", () => {
      this.socket.emit("system:info", this.deviceId, this.telemetry.systemInfo);
    });

    this.socket.on("request:system:stats", async () => {
      const stats = await this.telemetry.stats();
      this.socket.emit("system:stats", this.deviceId, stats);
    });
  }

  on<EV extends keyof ClientDeviceEvents[T]>(ev: EV, listener: ClientDeviceEvents[T][EV]) {
    this.socket.on(ev as any, listener as any);
  }

  emit<EV extends keyof HubEvents[T]>(ev: EV, ...args: HubToClientParams<T, EV>) {
    this.socket.emit(ev as any, ...(args as any));
  }
}

export default HubClient;
