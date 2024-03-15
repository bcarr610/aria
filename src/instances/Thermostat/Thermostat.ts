import HVAC from "../HVAC/HVAC";
import TemperatureSensor from "../DHTSensor/DHTSensor";
import { E_HVACTrigger, E_ThermostatMode } from "../../enums";
import {
  calculateTemperatureChangeSpeedPerHour,
  dateFromNow,
  getTriggerFromMode,
} from "../../utils/utils";

class Thermostat {
  target: number = 72;
  temperature: number = 72;
  humidity: number = 0.25;
  idleSpeedPerHour: number = 0;
  tempSpeedPerHour: number = 0;
  config: ThermostatConfig;
  hvac: HVAC;
  mode: E_ThermostatMode = E_ThermostatMode.auto;
  sensor: TemperatureSensor;
  onUpdate: (thermostat: Thermostat) => void = () => {};

  constructor(config: ThermostatConfig, sensor: TemperatureSensor, hvac: HVAC) {
    this.config = config;
    this.sensor = sensor;
    this.hvac = hvac;
    this.sendUpdate = this.sendUpdate.bind(this);
    this.onNewSensorData = this.onNewSensorData.bind(this);

    this.sensor.onUpdate = this.onNewSensorData;
  }

  private sendUpdate(): void {
    if (typeof this.onUpdate === "function") {
      this.onUpdate(this);
    }
  }

  private get shouldTriggerIdle(): boolean {
    return (
      this.temperature >= this.target &&
      this.temperature <= this.target + 1 &&
      this.hvac.canQueue(E_HVACTrigger.idle)
    );
  }

  private get shouldCirculate(): boolean {
    return (
      new Date().getTime() >=
        this.hvac.lastTriggers[E_HVACTrigger.idle].getTime() +
          this.config.hvac.circulateAirEveryMin * 60 * 1000,
      this.hvac.canQueue(E_HVACTrigger.fan)
    );
  }

  private get shouldTriggerCool(): boolean {
    const triggerCoolAt = this.target + this.config.targetOffset;
    return (
      this.temperature >= triggerCoolAt &&
      this.hvac.canQueue(E_HVACTrigger.cool)
    );
  }

  // TODO Implement better logic for when to use stage 2 and e heat
  private get shouldTriggerHeat(): boolean {
    const triggerHeatAt = this.target - this.config.targetOffset;
    return (
      this.temperature <= triggerHeatAt &&
      this.hvac.canQueue(E_HVACTrigger.heat)
    );
  }

  private get shouldTriggerHeatStage2(): boolean {
    const now = new Date();
    const canQueue = this.hvac.canQueue(E_HVACTrigger.heatStage2);
    const lastHeatTrigger = this.hvac.lastTriggers[E_HVACTrigger.heat];
    const settings = this.config.hvac.stageSettings.heat.stage2;

    // Hard queue when temperature too cool
    if (
      this.temperature <= this.target + settings.targetOffsetTrigger &&
      canQueue
    ) {
      return true;
    }

    if (
      now.getTime() >
        lastHeatTrigger.getTime() + settings.waitTimeMin * 60 * 1000 &&
      this.tempSpeedPerHour < settings.nonIdleSpeedTrigger &&
      canQueue
    ) {
      return true;
    }

    return false;
  }

  private get shouldTriggerEmergencyHeat(): boolean {
    const now = new Date();
    const canQueue = this.hvac.canQueue(E_HVACTrigger.heatEmergency);
    const lastStage2HeatAt = this.hvac.lastTriggers[E_HVACTrigger.heatStage2];
    const settings = this.config.hvac.stageSettings.heat.emergency;

    // Hard queue when temperature too cool
    if (
      this.temperature <= this.target + settings.targetOffsetTrigger &&
      canQueue
    ) {
      return true;
    }

    // If stage2 heating and temperature not rising fast enough
    if (
      now.getTime() >
        lastStage2HeatAt.getTime() + settings.waitTimeMin * 60 * 1000 &&
      this.tempSpeedPerHour < settings.nonIdleSpeedTrigger &&
      canQueue
    ) {
      return true;
    }

    return false;
  }

  private onTHChange(newTemp: number, newHumid: number, at: Date) {
    // Update temp change speeds
    this.tempSpeedPerHour = calculateTemperatureChangeSpeedPerHour(
      this.config.sensors.thSensorReadIntervalSec,
      this.temperature,
      newTemp
    );

    if (this.hvac.isIdle) {
      this.idleSpeedPerHour = calculateTemperatureChangeSpeedPerHour(
        this.config.sensors.thSensorReadIntervalSec,
        this.temperature,
        newTemp
      );
    }

    // Update sensor data
    this.temperature = newTemp;
    this.humidity = newHumid;

    // Trigger action if in auto
    if (this.mode !== E_ThermostatMode.auto) {
      if (this.shouldTriggerIdle) {
        this.hvac.queue(
          E_HVACTrigger.idle,
          dateFromNow(this.config.hvac.idleDelaySec * 1000)
        );
      } else if (this.shouldCirculate) {
        this.hvac.queue(E_HVACTrigger.fan);
      } else if (this.shouldTriggerCool) {
        this.hvac.queue(E_HVACTrigger.cool);
      } else if (this.shouldTriggerEmergencyHeat) {
        this.hvac.queue(E_HVACTrigger.heatEmergency);
      } else if (this.shouldTriggerHeatStage2) {
        this.hvac.queue(E_HVACTrigger.heatStage2);
      } else if (this.shouldTriggerHeat) {
        this.hvac.queue(E_HVACTrigger.heat);
      }
    }

    this.sendUpdate();
  }

  private onNewSensorData(sensor: TemperatureSensor): void {
    if (
      sensor.avgTemp !== this.temperature ||
      sensor.avgHumid !== this.humidity
    ) {
      this.onTHChange(sensor.avgTemp, sensor.avgHumid, sensor.lastReading.at);
    }
  }

  changeMode(mode: E_ThermostatMode): void {
    this.mode = mode;

    if (this.mode !== E_ThermostatMode.auto) {
      const trigger = getTriggerFromMode(mode);
      this.hvac.queue(trigger);
    }
    this.sendUpdate();
  }

  changeTarget(target: number): void {
    if (target > 50 && target < 90) {
      this.target = target;
      this.sendUpdate();
    }
  }

  start() {
    this.sensor.start();
  }

  stop() {
    this.sensor.stop();
  }
}

export default Thermostat;
