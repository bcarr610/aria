import crypto from "node:crypto";
import { shuffle } from "./array";

export const strongHash = (...data: any[]): string => {
  const rand = randomBytes(16);
  const dataString = shuffle([...(data || []), rand, new Date().getTime().toString()])
    .map((v) => String(v))
    .join("-");
  const hashed = hash(dataString);
  return hashed;
};

export const generateUserSessionToken = (): UserSessionToken => {
  return strongHash(randomBytes());
};

export const generateSessionSecret = (): string => {
  return strongHash();
};

export const generateStaticHubKey = (): string => {
  return strongHash();
};

export const randomBytes = (len: number = 16): string => {
  return crypto.randomBytes(len).toString("hex");
};

export const hash = (data: string): string => {
  const hash = crypto.createHash("sha256");
  hash.update(data);
  return hash.digest("hex");
};

export const hashPassword = (secret: PasswordSecret, password: string) => {
  const [salt, pepper] = secret.split("_");
  const decorated = [salt, password, pepper].join("");
  return hash(decorated);
};
