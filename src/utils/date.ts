import { timeToMs } from "./utils";

export const now = () => new Date().getTime();

export const fromNow = (value: Time["value"], unit: Time["unit"]) => {
  const d = new Date();
  d.setTime(d.getTime() + timeToMs({ unit, value }));
  return d.getTime();
};
