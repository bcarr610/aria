import os from "node:os";
import fs from "node:fs";

export const getHost = (): string => {
  let host: string = os.hostname();
  const networkInterfaces = os.networkInterfaces();
  Object.keys(networkInterfaces).forEach((interfaceName) => {
    networkInterfaces?.[interfaceName]?.forEach((interfaceInfo) => {
      if (!interfaceInfo.internal && interfaceInfo.family === "IPv4") {
        host = interfaceInfo.address;
      }
    });
  });

  return host;
};

// Returns degrees per hour
export const calculateTempChangeSpeed = (
  readSpeed: number,
  previousTemp: number,
  currentTemp: number
): number => ((currentTemp - previousTemp) / readSpeed) * 60000;

export const wait = async (ms: number) =>
  new Promise((resolve, reject) => {
    setTimeout(resolve, ms);
  });

export const calculateTimeToReachTemp = (
  rate: number,
  currentTemp: number,
  target: number
) => {
  const diff = target - currentTemp;
  if (diff === 0) return 0;
  if (rate === 0) return diff > 0 ? +Infinity : -Infinity;
  return diff / (rate / (60 * 60 * 1000));
};

export const timeToMs = (time: Time): number => {
  switch (time.unit) {
    case "MILLISECONDS":
      return time.value;
    case "SECONDS":
      return time.value * 1000;
    case "MINUTES":
      return time.value * 1000 * 60;
    case "HOURS":
      return time.value * 1000 * 60 * 60;
    case "DAYS":
      return time.value * 1000 * 60 * 60 * 24;
  }
};

export const greatest = <T extends number | Date>(...inputs: T[]): T => {
  const greatest = inputs.sort((a, b) => {
    const aInt = a instanceof Date ? a.getTime() : a;
    const bInt = b instanceof Date ? b.getTime() : b;
    return aInt < bInt ? 1 : -1;
  });
  if (greatest[0]) return greatest[0];
  else {
    if (!inputs) return 0 as T;
    if (inputs[0] instanceof Date) return new Date() as T;
  }

  return 0 as T;
};

export const clamp = (
  input: number,
  minMax?: [number] | [number | undefined, number | undefined]
): number => {
  const min = minMax?.[0] ?? -Infinity;
  const max = minMax?.[1] ?? Infinity;
  let out: number = input;
  if (out < min) out = min;
  else if (out > max) out = max;
  return out;
};

export const nowPlus = (ms: number) => {
  return new Date(new Date().getTime() + ms);
};

export const sum = (input: number[]) =>
  input.reduce((p, c) => {
    let out = p;
    out += c;
    return out;
  }, 0);

export const mean = (input: number[], precision: number = 2) => {
  if (input.length === 0) return 0;
  if (input.length === 1) return input[0];
  return Number((sum(input) / input.length).toFixed(precision));
};

export const random = (
  min: number,
  max: number,
  precision: number = 2
): number => {
  return Number((Math.random() * (max - min) + min).toFixed(precision));
};

export const isRemote = () => process.env.NODE_ENV === "remote";
export const isDev = () => process.env.NODE_ENV === "development";
export const isProd = () => process.env.NODE_ENV === "production";
export const getRoot = () => process.cwd();

export const readJsonSync = <T>(path: string): T => {
  const content = fs.readFileSync(path, "utf-8");
  const json: T = JSON.parse(content) as unknown as T;
  return json;
};
