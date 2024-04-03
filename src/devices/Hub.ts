import express, { Application } from "express";
import { createServer, Server as HttpServer } from "node:http";
import { Server as IOServer } from "socket.io";

class Hub {
  private port: number;
  private app: Application;
  private server: HttpServer;
  private io: IOServer;
  private controllers;
  private devices;

  constructor(port: number = 4000) {
    this.port = port;
    this.app = express();
    this.server = createServer(this.app);
    this.io = new IOServer<HubToClientEvents, ClientToHubEvents, InterWSEvents, WSData>(
      this.server
    );
  }

  start() {
    this.server.listen(this.port);
  }
}
