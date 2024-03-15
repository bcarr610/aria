import os from "node:os";
import { E_HVACTrigger, E_ThermostatMode } from "../enums";

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

export const dateFromNow = (...addMS: number[]): Date => {
  const date = new Date();
  addMS.forEach((ms) => {
    date.setTime(date.getTime() + ms);
  });
  return date;
};

export const getTriggerFromMode = (mode: E_ThermostatMode): E_HVACTrigger => {
  switch (mode) {
    case E_ThermostatMode.cool:
      return E_HVACTrigger.cool;
    case E_ThermostatMode.fan:
      return E_HVACTrigger.fan;
    case E_ThermostatMode.heat:
      return E_HVACTrigger.heat;
    case E_ThermostatMode.heatStage2:
      return E_HVACTrigger.heatStage2;
    case E_ThermostatMode.emergencyHeat:
      return E_HVACTrigger.heatEmergency;
    case E_ThermostatMode.off:
    default:
      return E_HVACTrigger.idle;
  }
};

// Returns degrees per hour
export const calculateTemperatureChangeSpeedPerHour = (
  readSpeedSeconds: number,
  previousTemp: number,
  currentTemp: number
): number => (currentTemp - previousTemp) * (3600 * readSpeedSeconds);

export const wait = async (ms: number) =>
  new Promise((resolve, reject) => {
    setTimeout(resolve, ms);
  });
