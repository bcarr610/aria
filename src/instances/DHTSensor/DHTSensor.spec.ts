import { expectSoftTimeCloseTo } from "../../test/utils";
import DHTSensor from "./DHTSensor";

let dht = new DHTSensor(11, 0, 4);

beforeEach(() => {
  dht = new DHTSensor(11, 0, 4);
});

afterEach(() => {
  jest.clearAllMocks();
});

describe("DHTSensor.sendUpdate", () => {
  it("Should execute onUpdate property", () => {
    const mock = jest.spyOn(dht, "onUpdate");
    dht["sendUpdate"]();
    expect(mock).toHaveBeenCalledTimes(1);
  });
});

describe("DHTSensor.initialize", () => {
  it("Should return true ", () => {
    const res = dht["initialize"](11, 0);
    expect(res).toBe(true);
  });
});

describe("DHTSensor.read", () => {
  it("Should return reading", () => {
    const res = dht["read"]();
    expect(res.temperature).toBeGreaterThan(65);
    expect(res.temperature).toBeLessThan(78);
    expectSoftTimeCloseTo(res.at, new Date());
  });
});

describe("DHTSensor.avg", () => {
  it("Should return avgTemp and avgHumid", () => {
    const res = dht.avg;
    expect(res.temperature).toBe(dht.avgTemp);
    expect(res.humidity).toBe(dht.avgHumid);
  });
});

describe("DHTSensor.addReading", () => {
  it("Should add reading if less than mean precision", () => {
    dht["addReading"]({ temperature: 70, humidity: 0.25 });
    expect(dht["readings"].length).toBe(1);
    expect(dht["readings"][0].temperature).toBe(70);
    expect(dht["readings"][0].humidity).toBe(0.25);
  });

  it("Should shift reading if greater than / equal to mean precision", () => {
    expect(dht["readings"].length).toBe(0);
    for (let i = 0; i < dht["meanPrecision"] + 1; i++) {
      dht["addReading"]({ temperature: 70 + i, humidity: 0.25 + i * 0.1 });
    }
    expect(dht["readings"].length).toBe(dht["meanPrecision"]);
    expect(dht["readings"].slice(-1)[0].temperature).toBe(
      70 + dht["meanPrecision"]
    );
    expect(dht["readings"].slice(-1)[0].humidity).toBe(
      0.25 + 0.1 * dht["meanPrecision"]
    );
  });
});

describe("DHTSensor.clock", () => {
  it("Should update class state", () => {
    const oldTemp = dht.avgTemp;
    const oldHumid = dht.avgHumid;
    const oldSpeed = dht.speed;
    for (let i = 0; i < 20; i++) {
      dht.clock();
    }
    expect(dht.avgTemp).not.toBe(oldTemp);
    expect(dht.avgHumid).not.toBe(oldHumid);
    expect(dht.speed).not.toBe(oldSpeed);
  });
});
