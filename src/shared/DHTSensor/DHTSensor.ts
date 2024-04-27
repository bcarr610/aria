import sensor, { SensorData, SensorType } from "node-dht-sensor";
import { calculateTempChangeSpeed, mean } from "../../utils";
import { random } from "../../utils/number";

type AvgReading = { temperature: number; humidity: number };

class DHTSensor {
  type: 11 | 22;
  pin: number;
  tmpOffset: number;
  humidOffset: number;
  precision: number;
  speed: number = 0;
  avgTemp: number = 72;
  avgHumid: number = 0.25;
  private readings: DHTSensorReading[] = [];

  constructor(
    type: 11 | 22,
    pin: number,
    tmpOffset: number = 0,
    humidOffset: number = 0,
    precision: number = 2
  ) {
    this.type = type;
    this.pin = pin;
    this.tmpOffset = tmpOffset;
    this.humidOffset = humidOffset;
    this.precision = precision;
    this.initialize(type, pin);
  }

  get avg(): AvgReading {
    return {
      temperature: this.avgTemp,
      humidity: this.avgHumid,
    };
  }

  private initialize(type: SensorType, pin: number): boolean {
    return sensor?.initialize(type, pin);
  }

  private read(): DHTSensorReading {
    const reading: SensorData = sensor?.read(this.type, this.pin);
    return {
      temperature: reading.temperature + this.tmpOffset,
      humidity: reading.humidity + this.humidOffset,
      at: new Date(),
    };
  }

  private addReading(reading: Omit<DHTSensorReading, "at">) {
    if (this.readings.length >= this.precision) {
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
      this.readings.length > 0 ? this.readings.slice(-1)[0].at.getTime() - now.getTime() : 0;
    const oldAvgTemp = this.avg.temperature;
    this.addReading(reading);
    const newAvgTemp = mean(this.readings.map((v) => v.temperature));
    const newAvgHumid = mean(this.readings.map((v) => v.humidity));
    const newSpeed = calculateTempChangeSpeed(rate, oldAvgTemp, newAvgTemp);

    this.avgTemp = newAvgTemp;
    this.avgHumid = newAvgHumid;
    this.speed = newSpeed;
  }
}

export default DHTSensor;
