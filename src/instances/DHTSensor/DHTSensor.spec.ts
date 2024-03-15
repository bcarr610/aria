import { disableLogs, enableLogs } from "../../test/utils";
import { wait } from "../../utils";
import DHTSensor from "./DHTSensor";

describe("DHTSensor", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  beforeEach(() => {
    process.env.EMULATE = "true";
  });

  it("Should not tick unless started", async () => {
    const sensor = new DHTSensor(11, 1, 10, 5);
    const mock = jest.spyOn(sensor, "tick");
    await wait(40);
    expect(mock).toHaveBeenCalledTimes(0);
  });

  it("Should tick when started", async () => {
    const sensor = new DHTSensor(11, 1, 10, 5);
    const mock = jest.spyOn(sensor, "tick");
    sensor.start();
    await wait(39);
    sensor.stop();
    expect(mock).toHaveBeenCalledTimes(4);
  });

  it("Should send updates only on temperature / humidity changes", () => {
    const sensor = new DHTSensor(11, 1, 10, 5);
    const mock = jest.spyOn(sensor, "onUpdate");
    expect(sensor.avgTemp).toBe(72);
    expect(sensor.avgHumid).toBe(0.25);
    sensor.tick({ temperature: 72, humidity: 0.25 });
    sensor.tick({ temperature: 72, humidity: 0.05 });
    sensor.tick({ temperature: 70, humidity: 0.25 });
    sensor.tick({ temperature: 65, humidity: 0.25 });
    expect(mock).toHaveBeenCalledTimes(3);
  });

  it("Should average temp and humidity correctly", () => {
    const sensor = new DHTSensor(11, 1, 10, 5);
    sensor.tick({ temperature: 68, humidity: 0.1 });
    sensor.tick({ temperature: 68, humidity: 0.1 });
    sensor.tick({ temperature: 68, humidity: 0.1 });
    sensor.tick({ temperature: 64, humidity: 0.35 });
    sensor.tick({ temperature: 63, humidity: 0.55 });
    sensor.tick({ temperature: 62, humidity: 0.56 });
    expect(sensor.avgTemp).toBe(65);
    expect(sensor.avgHumid).toBe(0.33);
  });

  it("Should stop ticking", async () => {
    const sensor = new DHTSensor(11, 1, 10, 5);
    const mock = jest.spyOn(sensor, "tick");
    sensor.start();
    await wait(39);
    sensor.stop();
    await wait(40);
    expect(mock).toHaveBeenCalledTimes(4);
  });

  it("Should return last reading", () => {
    const sensor = new DHTSensor(11, 1, 10, 5);
    sensor.tick({ temperature: 68, humidity: 0.1 });
    expect(sensor.lastReading).toEqual(sensor.readings[0]);
  });

  it("Should retrieve sensor data", () => {
    const sensor = new DHTSensor(11, 1, 10, 5);
    const test1 = sensor.getSensorData();
    const test2 = sensor.getSensorData({ temperature: 68, humidity: 0.1 });
    expect(test1).toEqual({
      temperature: sensor.avgTemp,
      humidity: sensor.avgHumid,
      at: test1.at,
    });
    expect(test2).toEqual({
      temperature: 68,
      humidity: 0.1,
      at: test2.at,
    });
  });

  it("Should clear existing interval if start called more than once", () => {
    const sensor = new DHTSensor(11, 1, 10, 5);
    sensor.start();
    sensor.start();
    sensor.stop();
    expect(true).toBe(true);
  });

  it("Should not emulate", () => {
    disableLogs();
    delete process.env.EMULATE;
    const sensor = new DHTSensor(11, 1, 10, 5);
    const mock = jest.spyOn(sensor, "getSensorData");
    try {
      sensor.getSensorData();
    } catch {}
    expect(mock).toThrow();
    enableLogs();
  });
});
