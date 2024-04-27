import UserStore, { User } from "../stores/UserStore";
import DeviceStore, { Device } from "../stores/DeviceStore";
import HubStore from "../stores/HubStore";

declare module "express-session" {
  interface SessionData {
    user: User;
  }
}

declare global {
  namespace Express {
    export interface Request {
      headers: {
        "X-Access-Key": string;
        "X-User-Token": string;
      };
      stores: {
        devices: DeviceStore;
        users: UserStore;
        hub: HubStore;
      };
    }
  }
}

export {};
