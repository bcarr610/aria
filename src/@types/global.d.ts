export {};

declare module "express-session" {
  interface SessionData {
    hubToken: string;
    deviceId: string;
    userToken: string | null;
  }
}

export {};

declare global {
  namespace Express {
    export interface Request {
      headers: {
        "X-Hub-Token": string;
        "X-Device-ID": string;
        "X-User-Token": string;
      };
      cookies: {
        hst: string;
      };
    }
  }
}
