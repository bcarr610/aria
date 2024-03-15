import sensor, { SensorData, SensorType } from "node-dht-sensor";

class DHTSensor {
  emulate: boolean;
  sensorType: SensorType;
  readSpeedMS: number;
  thSensorReadLength: number;
  interval: NodeJS.Timeout | null = null;
  pin: number;
  readings: DHTSensorReading[] = [];
  avgTemp: number = 72;
  avgHumid: number = 0.25;
  onUpdate: (dhtSensor: DHTSensor) => void = () => {};

  constructor(
    sensorType: SensorType,
    pin: number,
    readSpeedMS: number,
    thSensorReadLength: number
  ) {
    this.emulate = process.env.EMULATE === "true";
    this.sensorType = sensorType;
    this.pin = pin;
    this.readSpeedMS = readSpeedMS;
    this.thSensorReadLength = thSensorReadLength;

    sensor?.initialize(this.sensorType, this.pin);
  }

  sendUpdate() {
    if (typeof this.onUpdate === "function") this.onUpdate(this);
  }

  getSensorData(mockData?: SensorData): DHTSensorReading {
    const readSensor = () => {
      try {
        return sensor?.read(this.sensorType, this.pin);
      } catch (err) {
        if (!this.emulate) console.error(err);
        return {
          temperature: this.avgTemp,
          humidity: this.avgHumid,
        };
      }
    };

    const { temperature, humidity } = mockData || readSensor();

    return {
      temperature,
      humidity,
      at: new Date(),
    };
  }

  get lastReading() {
    return this.readings.slice(-1)[0];
  }

  avgReading(readings: DHTSensorReading[]) {
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
      temperature:
        readings.length > 0
          ? Number((tmpAdd / readings.length).toFixed(2))
          : this.avgTemp,
      humidity:
        readings.length > 0
          ? Number((humidAdd / readings.length).toFixed(2))
          : this.avgHumid,
    };
  }

  tick(mockData?: SensorData) {
    let shouldSendUpdate = false;
    const reading = this.getSensorData(mockData);
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

  start(mockData?: SensorData) {
    if (this.interval !== null) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.tick(mockData);
    this.interval = setInterval(this.tick.bind(this), this.readSpeedMS);
  }

  stop() {
    if (this.interval !== null) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}

export default DHTSensor;
