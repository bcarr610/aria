import ThermostatSchedule from "./ThermostatSchedule";

let schedule: ThermostatSchedule;
beforeEach(() => {
  schedule = new ThermostatSchedule();
});

describe("ThermostatSchedule.constructor", () => {
  it("Should not set schedule", () => {
    expect(schedule.list).toEqual([]);
  });

  it("Should set schedule", () => {
    const t = new Date(new Date().getTime() + 1000);
    const s = new ThermostatSchedule([
      {
        target: 70,
        time: t,
      },
    ]);
    expect(s.list).toEqual([{ target: 70, time: t }]);
  });
});

describe("Thermostat.set", () => {
  it("Should set schedule", () => {
    const t = new Date(new Date().getTime() + 1000);
    schedule.set([{ target: 70, time: t }]);
    expect(schedule.list).toEqual([{ target: 70, time: t }]);
  });
});

describe("Thermostat.add", () => {
  it("Should add items", () => {
    const t1 = new Date(new Date().getTime() + 10000);
    const t2 = new Date(new Date().getTime() + 4500);
    const t3 = new Date(new Date().getTime() + 2000);
    const t4 = new Date(new Date().getTime() - 10000);
    const i1: ThermostatScheduleItem = { target: 68, time: t1 };
    const i2: ThermostatScheduleItem = { target: 30, time: t2 };
    const i3: ThermostatScheduleItem = { target: 72, time: t3 };
    const i4: ThermostatScheduleItem = { target: 72, time: t4 };
    schedule.add(i1, i2, i3, i4);
    expect(schedule.list).toEqual([
      { target: 72, time: t3 },
      { target: 68, time: t1 },
    ]);
  });
});

describe("Thermostat.remove", () => {
  it("Should remove items", () => {
    const time = new Date(new Date().getTime() + 10000);

    const t = (plus: number) => {
      const d = new Date(time);
      d.setTime(d.getTime() + plus);
      return d;
    };
    schedule.set([
      { target: 65, time: t(10) },
      { target: 66, time: t(20) },
      { target: 67, time: t(30) },
      { target: 68, time: t(40) },
      { target: 69, time: t(50) },
      { target: 70, time: t(60) },
      { target: 71, time: t(70) },
    ]);
    schedule.remove("first", "last", 0, 3, 4);
    expect(schedule.list).toEqual([
      { target: 66, time: t(20) },
      { target: 67, time: t(30) },
      { target: 70, time: t(60) },
    ]);
  });
});
