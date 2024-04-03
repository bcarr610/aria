import os from "node:os";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

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

export const calculateTimeToReachTemp = (rate: number, currentTemp: number, target: number) => {
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

export const random = (min: number, max: number, precision: number = 2): number => {
  return Number((Math.random() * (max - min) + min).toFixed(precision));
};

export const isRemote = () => process.env.NODE_ENV === "remote";
export const isDev = () => process.env.NODE_ENV === "development";
export const isProd = () => process.env.NODE_ENV === "production";

export const deepMerge = <T extends object>(target: T, ...sources: any[]): T => {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isMergeableObject(target) && isMergeableObject(source)) {
    for (const k in source) {
      const key = k as keyof T;
      const canMerge = isMergeableObject(source[key]);

      if (canMerge) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        deepMerge(target[key] as object, source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return deepMerge(target, ...sources);
};

export const isMergeableObject = (obj: any): boolean =>
  obj !== null && typeof obj === "object" && !Array.isArray(obj);

export const writeFileSync = (filePath: string, content: any) => {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(filePath, content);
};

export const writeFile = async (filePath: string, content: any) => {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    await fs.promises.mkdir(dir, { recursive: true });
  }

  await fs.promises.writeFile(filePath, content);
};

export const writeJsonSync = (filePath: string, content: any) => {
  writeFile(filePath, JSON.stringify(content, null, 2));
};

export const writeJson = async (filePath: string, content: any) => {
  await writeFile(filePath, JSON.stringify(content, null, 2));
};

export const readJsonSync = <T>(filePath: string): T => {
  const resp = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(resp) as T;
};

export const readJson = async <T>(filePath: string): Promise<T> => {
  const resp = await fs.promises.readFile(filePath, "utf-8");
  return JSON.parse(resp) as T;
};

export const getHMSTime = (hms: HMS): number => {
  const d = new Date();
  d.setHours(hms[0]);
  d.setMinutes(hms[1]);
  d.setSeconds(hms[2]);
  return d.getTime();
};

export const dateToMDY = (d: Date = new Date()): MDY => {
  return [d.getMonth() + 1, d.getDate(), d.getFullYear()];
};

export const mdyIsToday = (mdy: MDY): boolean => {
  const today = new Date();
  return (
    today.getMonth() + 1 === mdy[0] && today.getDate() === mdy[1] && today.getFullYear() === mdy[2]
  );
};

export const randomBytes = (len: number = 16) => {
  return crypto.randomBytes(len).toString("hex");
};
