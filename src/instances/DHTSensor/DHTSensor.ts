import sensor, { SensorData, SensorType } from "node-dht-sensor";
import { calculateTempChangeSpeed, mean, random } from "../../utils";
import { isRemote } from "../../utils";

type AvgReading = { temperature: number; humidity: number };

class DHTSensor {
  speed: number = 0;
  avgTemp: number = 72;
  avgHumid: number = 0.25;
  private sensorType: SensorType;
  private meanPrecision: number;
  private pin: number;
  private readings: DHTSensorReading[] = [];
  private tempOffset: number = 0;
  private humidOffset: number = 0;
  onUpdate: (data: DHTUpdateData) => void = () => {};

  constructor(
    sensorType: SensorType,
    pin: number,
    meanPrecision: number,
    tempOffset: number = 0,
    humidOffset: number = 0
  ) {
    this.sensorType = sensorType;
    this.pin = pin;
    this.meanPrecision = meanPrecision;
    this.tempOffset = tempOffset;
    this.humidOffset = humidOffset;

    this.initialize(this.sensorType, this.pin);
    this.sendUpdate();
  }

  get avg(): AvgReading {
    return {
      temperature: this.avgTemp,
      humidity: this.avgHumid,
    };
  }

  private sendUpdate() {
    if (typeof this.onUpdate === "function") {
      this.onUpdate({
        temperature: this.avgTemp,
        humidity: this.avgHumid,
        speed: this.speed,
      });
    }
  }

  private initialize(type: SensorType, pin: number): boolean {
    if (isRemote()) {
      return true;
    }

    return sensor?.initialize(type, pin);
  }

  private read(): DHTSensorReading {
    const reading: SensorData = isRemote()
      ? {
          temperature: random(65, 78),
          humidity: random(0, 1),
        }
      : sensor?.read(this.sensorType, this.pin);
    return {
      temperature: reading.temperature + this.tempOffset,
      humidity: reading.humidity + this.humidOffset,
      at: new Date(),
    };
  }

  private addReading(reading: Omit<DHTSensorReading, "at">) {
    if (this.readings.length >= this.meanPrecision) {
      this.readings.shift();
    }
    this.readings.push({
      ...reading,
      at: new Date(),
    });
  }

  clock() {
    const now = new Date();
    const reading = this.read();
    const rate =
      this.readings.length > 0
        ? this.readings.slice(-1)[0].at.getTime() - now.getTime()
        : 0;
    const oldAvgTemp = this.avg.temperature;
    this.addReading(reading);
    const newAvgTemp = mean(this.readings.map((v) => v.temperature));
    const newAvgHumid = mean(this.readings.map((v) => v.humidity));
    const newSpeed = calculateTempChangeSpeed(rate, oldAvgTemp, newAvgTemp);

    if (
      newAvgTemp !== this.avgTemp ||
      newAvgHumid !== this.avgHumid ||
      this.speed !== newSpeed
    ) {
      this.sendUpdate();
    }

    this.avgTemp = newAvgTemp;
    this.avgHumid = newAvgHumid;
    this.speed = newSpeed;
  }
}

export default DHTSensor;
