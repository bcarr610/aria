import socket, { Socket } from "socket.io-client";
import Telemetry from "../Telemetry";

class AriaClientDevice {
  private deviceType: AriaClientDeviceType;
  private socketId: string | undefined;
  private connected: boolean = false;
  private hub: Socket<HubToClientEvents, ClientToHubEvents>;
  private telemetry: Telemetry;
  deviceId: string;
  on;
  emit;

  constructor(
    deviceType: AriaClientDeviceType,
    deviceId: string,
    hubUrl: HubUrl,
    telemetry: Telemetry
  ) {
    this.deviceType = deviceType;
    this.deviceId = deviceId;
    this.hub = socket(hubUrl);
    this.telemetry = telemetry;
    this.socketId = this.hub.id;
    this.on = this.hub.on;
    this.emit = this.hub.emit;

    this.hub.on("connect", this.onConnect.bind(this));
    this.hub.on("disconnect", this.onDisconnect.bind(this));
    this.hub.on("request:system:info", this.onRequestSystemInfo.bind(this));
    this.hub.on("telemetry:set", this.onSetTelemetry.bind(this));
    this.telemetry.onTelemetryStats = this.onTelemetryStats.bind(this);
  }

  async initialize() {
    await this.telemetry.initialize();
    this.emit("device:ready", this.deviceId, this.telemetry.systemInfo as SystemInfo);
  }

  private onConnect() {
    this.connected = true;
    this.socketId = this.hub.id;
  }

  private onDisconnect(reason: Socket.DisconnectReason) {
    this.connected = false;
  }

  private onRequestSystemInfo() {
    this.emit("system:info", this.deviceId, this.telemetry.systemInfo);
  }

  private onSetTelemetry(active: boolean) {
    if (active) this.telemetry.activate();
    else this.telemetry.deactivate();
  }

  private onTelemetryStats(data: TelemetryStats) {
    this.emit("system:telemetry", this.deviceId, data);
  }
}

export default AriaClientDevice;
