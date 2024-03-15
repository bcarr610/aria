import AriaServer from "../instances/AriaServer/AriaServer";
import EventManager from "../EventManager";

declare global {
  var __ROOT__: string;
  var __SERVER__: AriaServer;
  var __EVENT_MANAGER__: EventManager;
}

export {};
