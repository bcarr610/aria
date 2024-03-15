import sensor from "node-dht-sensor";
import Interval from "../Interval";

class DHTSensor {
  private dht: 11 | 22;
  private readSpeedMS: number;
  private thSensorReadLength: number;
  private readInterval: Interval;
  private gpio: I_GPIO;
  private readings: DHTSensorReading[] = [];
  avgTemp: number = 72;
  avgHumid: number = 72;
  onUpdate: (dhtSensor: DHTSensor) => void = () => {};

  constructor(
    dht: 11 | 22,
    gpio: I_GPIO,
    readSpeedMS: number,
    thSensorReadLength: number
  ) {
    this.dht = dht;
    this.gpio = gpio;
    this.readSpeedMS = readSpeedMS;
    this.thSensorReadLength = thSensorReadLength;
    this.readInterval = new Interval(this.readSpeedMS, this.tick.bind(this));

    // this.sendUpdate = this.sendUpdate.bind(this);
    // this.getSensorData = this.getSensorData.bind(this);
    // this.tick = this.tick.bind(this);
  }

  private sendUpdate() {
    if (typeof this.onUpdate === "function") this.onUpdate(this);
  }

  private getSensorData(): DHTSensorReading {
    const reading = sensor.read(this.dht, this.gpio.pin);
    return {
      temperature: reading.temperature,
      humidity: reading.humidity,
      at: new Date(),
    };
  }

  get lastReading() {
    return this.readings.slice(-1)[0];
  }

  private avgReading(readings: DHTSensorReading[]) {
    const tmpAdd: number = readings
      .map((v) => v.temperature)
      .reduce((p, c) => {
        p += c;
        return p;
      }, 0);
    const humidAdd: number = readings
      .map((v) => v.humidity)
      .reduce((p, c) => {
        p += c;
        return p;
      }, 0);
    return {
      temperature: tmpAdd / readings.length,
      humidity: humidAdd / readings.length,
    };
  }

  private tick() {
    let shouldSendUpdate = false;
    const reading = this.getSensorData();
    const currentAvg = this.avgReading(this.readings);

    if (this.readings.length < this.thSensorReadLength) {
      this.readings.push(reading);
    } else {
      this.readings = [...this.readings.slice(1), reading];
    }

    const newAvg = this.avgReading(this.readings);
    if (newAvg.temperature !== currentAvg.temperature) {
      if (!shouldSendUpdate) shouldSendUpdate = true;
      this.avgTemp = newAvg.temperature;
    }

    if (newAvg.humidity !== currentAvg.humidity) {
      if (!shouldSendUpdate) shouldSendUpdate = true;
      this.avgHumid = newAvg.humidity;
    }

    if (shouldSendUpdate) this.sendUpdate();
  }

  start() {
    this.readInterval.start();
  }

  stop() {
    this.readInterval.stop();
  }
}

export default DHTSensor;
