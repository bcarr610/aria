import axios from "axios";
import express, { Application, Request, Response } from "express";
import socket, { Socket } from "socket.io-client";
import AriaDevice from "./AriaDevice";
import { wait } from "../utils";
import PersistentStateMachine from "./PersistentStateMachine";

class HubClient<T extends keyof ClientEvents> extends AriaDevice<T> {
  private hubToken: string = "";
  private hubUrl: HubUrl;
  private ports: { hub: number; client: number };
  private fullHubUrl: string;
  private app: Application;
  private socket: Socket<SharedClientEvents, SharedHubEvents> | null = null;
  private clientState: PersistentStateMachine<PersistentClientState>;

  constructor(deviceType: T, deviceName: string, opts: ClientDeviceArgs) {
    super(deviceType, deviceName, opts);
    this.app = express();
    this.hubUrl = opts.hubUrl;
    this.ports = opts.ports;
    this.fullHubUrl = `${this.hubUrl}:${this.ports.hub}`;
    this.clientState = new PersistentStateMachine(
      {
        token: this.hubToken,
        registered: false,
        lastHubConnection: null,
      },
      "client",
      opts.deviceStateSavePath
    );
  }

  on<EV extends keyof ClientEvents[T]>(ev: EV, listener: ClientEvents[T][EV]) {
    if (this.socket) this.socket.on(ev as any, listener as any);
  }

  emit<EV extends keyof HubEvents[T]>(ev: EV, ...args: HubToClientParams<T, EV>) {
    if (this.socket) this.socket.emit(ev as any, ...(args as any));
  }

  start() {
    this.app.listen(this.ports.client);
  }

  async connect() {
    await this.initializeDevice();
    let connected = false;

    while (!connected) {
      try {
        const url = this.fullHubUrl + "/connect";
        const resp = await axios(url, {
          method: "post",
          headers: {
            "X-Device-ID": this.deviceId,
          },
          data: {
            deviceType: this.deviceType,
            deviceName: this.deviceName,
            devicePort: this.ports.client,
          },
        });

        if (resp.status === 200) {
          connected = true;
          this.hubToken = resp.data.token;
          await this.clientState.update({
            token: this.hubToken,
            lastHubConnection: new Date().getTime(),
          });
          break;
        } else if (resp.status === 202) {
          this.logger.info(`Waiting for authorization to connect from hub...`);
        } else {
          this.logger.error(`Hub connection failed with status code: ${resp.status}`, {
            status: resp.statusText,
            data: resp.data,
          });
        }
      } catch (err) {
        this.logger.error("Error connecting to hub", err);
      }

      await wait(2000);
    }

    if (connected) {
      this.socket = socket(this.hubUrl, {
        auth: {
          token: this.hubToken,
        },
        extraHeaders: {
          "X-Device-ID": this.deviceId,
        },
      });

      this.socket.on("connect", () => {
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

      // Utility Middleware
      this.app.use(express.urlencoded({ extended: true }));
      this.app.use(express.json());

      // Authentication / Device Info
      this.app.use((req, res, next) => {
        res.setHeader("X-Device-ID", this.deviceId);
        res.setHeader("X-Hub-Token", this.hubToken);
        next();
      });

      this.app.use((req, res, next) => {
        const token = req.headers["X-Hub-Token"];
        if (!token) {
          res.status(400).send("Missing required request data");
        } else if (token !== this.hubToken) {
          res.status(403).send("Not Allowed");
        } else {
          next();
        }
      });

      // Routes
      this.app.get("/system/info", (req, res) => {
        res.status(200).send(this.telemetry.systemInfo);
      });

      this.app.get("/system/stats", async (req, res) => {
        const stats = await this.telemetry.stats();
        res.status(200).send(stats);
      });
    } else {
      this.logger.error("Failed to connect, unknown error");
    }
  }
}

export default HubClient;
