import { Request, Response, NextFunction } from "express";
import DataStore from "../../instances/DataStore";

class HubMiddleware {
  devices: DataStore<RegisteredDevice[]>;
  users: DataStore<User[]>;
  emailTokens: DataStore<EmailVerificationToken[]>;
  config: DataStore<HubConfig>;

  constructor(
    devices: DataStore<RegisteredDevice[]>,
    users: DataStore<User[]>,
    emailTokens: DataStore<EmailVerificationToken[]>,
    config: DataStore<HubConfig>
  ) {
    this.devices = devices;
    this.users = users;
    this.emailTokens = emailTokens;
    this.config = config;
  }

  private getHeader<H extends keyof AriaHeaders>(
    header: H,
    req: Request
  ): AriaHeaders[H] | undefined {
    const h = req.headers[header];
    if (!h) return undefined;
    if (Array.isArray(h)) return h[0] as AriaHeaders[H];
    return h as AriaHeaders[H];
  }

  private getUserSession(req: Request, res: Response) {
    if (!req.session) {
      res.status(403).send("Session required");
      return;
    }

    const token = this.getHeader("X-User-Session-Token", req);
    if (!token) {
      res.status(400).send("Missing session token in request");
      return;
    }

    const user = this.users.data.find((f) => f.sessionToken === token);
    if (!user) {
      res.status(404).send("User not found");
      return;
    }

    if (!user.sessionExpireAt || !user.sessionToken) {
      res.status(403).send("Please log in");
      return;
    }

    if (user.sessionExpireAt < new Date().getTime()) {
      res.status(403).send("Please log in");
      return;
    }

    return user;
  }

  deviceAccessRequired(configKey: keyof DeviceConfiguration) {
    return (req: Request, res: Response, next: NextFunction) => {
      const { device } = req.session;
      if (device?.config?.[configKey]) {
        next();
      } else {
        res.status(403).send("Not Allowed");
        return;
      }
    };
  }

  userSessionRequired(req: Request, res: Response, next: NextFunction) {
    const user = this.getUserSession(req, res);
    if (user) next();
    return;
  }

  rootUserRequired(req: Request, res: Response, next: NextFunction) {
    if (!req.session) {
      res.status(403).send("Session required");
      return;
    }

    const user = this.getUserSession(req, res);

    if (!user) return;

    if (!user.id) {
      res.status(500).send("Missing id for user in store");
      return;
    }

    if (!this.config.data.rootUser) {
      res.status(403).send("Root user has not been added to hub");
      return;
    }

    if (user.id !== this.config.data.rootUser) {
      res.status(403).send("Endpoint requires root user");
      return;
    }

    next();
  }

  emailVerifiedRequired(req: Request, res: Response, next: NextFunction) {
    const user = this.getUserSession(req, res);
    if (!user) return;
    if (!user.emailVerified) {
      res.status(403).send("Please verify your email address first");
      return;
    }
    next();
  }
}

export default HubMiddleware;
