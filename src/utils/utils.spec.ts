import os from "node:os";
import * as utils from "./utils";
import { expectSoftTimeCloseTo } from "../test/utils";

describe("utils", () => {
  describe("getHost", () => {
    const test = utils.getHost();
    expect(typeof test).toBe("string");
  });

  describe("calculateTempChangeSpeed", () => {
    it("Should calculate correct degree change per hour", () => {
      const test = utils.calculateTempChangeSpeed(1000, 70, 70.1);
      expect(test).toBeCloseTo(5.9, 0);
    });
  });

  describe("wait", () => {
    it("Should wait", async () => {
      const now = new Date();
      const target = new Date(now);
      target.setTime(target.getTime() + 1000);
      await utils.wait(1000);
      expectSoftTimeCloseTo(now, target);
    });
  });

  describe("calculateTimeToReachTemp", () => {
    it("Should calculate correct time in ms", () => {
      const test1 = utils.calculateTimeToReachTemp(1, 70, 71);
      const test2 = utils.calculateTimeToReachTemp(1, 72, 70);
      const test3 = utils.calculateTimeToReachTemp(1, 70, 70);
      const test4 = utils.calculateTimeToReachTemp(0.05, 70, 71);
      expect(test1).toBeCloseTo(3600000, 0.1);
      expect(test2).toBeCloseTo(-3600000 * 2, 0.1);
      expect(test3).toBe(0);
      expect(test4).toBeCloseTo(72000000, 0.1);
    });
  });

  describe("timeToMs", () => {
    it("Should convert all units to correct ms value", () => {
      expect(utils.timeToMs({ unit: "MILLISECONDS", value: 1000 })).toBe(1000);
      expect(utils.timeToMs({ unit: "SECONDS", value: 1 })).toBe(1000);
      expect(utils.timeToMs({ unit: "MINUTES", value: 1 })).toBe(60000);
      expect(utils.timeToMs({ unit: "HOURS", value: 1 })).toBe(3600000);
      expect(utils.timeToMs({ unit: "DAYS", value: 1 })).toBe(3600000 * 24);
    });
  });

  describe("returnGreatest", () => {
    it("Should return greatest date", () => {
      const dates = [new Date(), new Date(), new Date()];
      dates[1].setTime(dates[1].getTime() + 1000);
      dates[2].setTime(dates[2].getTime() - 2000);
      const res = utils.greatest(...dates);
      const t = res.getTime();
      expect(t).toBe(dates[1].getTime());
    });

    it("Should return greatest int", () => {
      expect(utils.greatest(1, 2, 3, 7, 4)).toBe(7);
    });
  });

  describe("Clamp", () => {
    it("Should not clamp", () => {
      expect(utils.clamp(10)).toBe(10);
    });

    it("Should clamp min", () => {
      expect(utils.clamp(-200, [-10])).toBe(-10);
    });

    it("Should clamp max", () => {
      expect(utils.clamp(100000, [1000, 5000])).toBe(5000);
    });
  });
});
