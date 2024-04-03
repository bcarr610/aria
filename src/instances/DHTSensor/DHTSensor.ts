import sensor, { SensorData, SensorType } from "node-dht-sensor";
import { calculateTempChangeSpeed, mean, random } from "../../utils";
import { isRemote } from "../../utils";
import PersistentStateMachine from "../PersistentStateMachine";

type AvgReading = { temperature: number; humidity: number };

class DHTSensor {
  speed: number = 0;
  avgTemp: number = 72;
  avgHumid: number = 0.25;
  state: PersistentStateMachine<DHTPersistentState>;
  private readings: DHTSensorReading[] = [];

  constructor(persistentStateMachine: PersistentStateMachine<DHTPersistentState>) {
    this.state = persistentStateMachine;

    this.initialize(this.state.values.type, this.state.values.pin);
  }

  get avg(): AvgReading {
    return {
      temperature: this.avgTemp,
      humidity: this.avgHumid,
    };
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
      : sensor?.read(this.state.values.type, this.state.values.pin);
    return {
      temperature: reading.temperature + this.state.values.tmpOffset,
      humidity: reading.humidity + this.state.values.humidityOffset,
      at: new Date(),
    };
  }

  private addReading(reading: Omit<DHTSensorReading, "at">) {
    if (this.readings.length >= this.state.values.precision) {
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
