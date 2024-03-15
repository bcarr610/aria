import express, { Application } from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { getHost } from "../../utils/utils";

class AriaServer implements I_AriaServer {
  app;
  server;
  io;
  config: AriaServerConfig;

  constructor(config?: Partial<Omit<AriaServerConfig, "host">>) {
    const defaultConfig: AriaServerConfig = {
      protocol: "http",
      host: getHost(),
      port: 3000,
    };

    this.config = {
      ...defaultConfig,
      ...config,
    };
    this.app = express();
    this.server = createServer(this.app);
    this.io = new Server<
      HubToThermostatEvents,
      ThermostatToHubEvents,
      InterThermostatEvents,
      SocketData
    >(this.server);
  }

  start(cb?: () => void) {
    this.server.listen(this.config.port);
    if (cb) cb();
  }
}

export default AriaServer;
