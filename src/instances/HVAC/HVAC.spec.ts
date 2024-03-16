import HVAC from "./HVAC";
import hvacWireConfigurations from "../../hvacWireConfigurations";
import hConfig from "../../../config/hvac.config.json";
import tConfig from "../../../config/thermostat.config.json";
import { E_HVACState, E_HVACTrigger } from "../../enums";
import { iterableEnum, wait } from "../../utils";
import {
  getHvacPinValues,
  softDateNum,
  targetHvacWireGpio,
} from "../../test/utils";

describe("HVAC", () => {
  let config: HVACConfig;
  let thermostatConfig: ThermostatConfig;

  const expectState = (incoming: E_HVACState, target: E_HVACState): void => {
    expect(incoming).toBe(target);
  };

  const expectGPIOState = (hvac: HVAC, targetTrigger: E_HVACTrigger): void => {
    const controls = hvac.config.controls;
    expect(controls.map((v) => v.gpio.readSync())).toEqual(
      targetHvacWireGpio(targetTrigger, controls)
    );
  };

  const expectSoftTimeCloseTo = (d1: Date, d2: Date): void => {
    const s1 = softDateNum(d1);
    const s2 = softDateNum(d2);
    expect(s1).toBeCloseTo(s2);
  };

  const testHVACTrigger = async (
    hvac: HVAC,
    trigger: E_HVACTrigger,
    triggerDelay: number = 0.0001,
    changeTo?: E_HVACTrigger
  ) => {
    const updateMock = jest.spyOn(hvac, "onUpdate");
    const queueMock = jest.spyOn(hvac, "queue");
    const executeMock = jest.spyOn(hvac, "executeNextTrigger");
    hvac.config.triggerDelayMinutes = triggerDelay;
    const triggerTimeMs = hvac.config.triggerDelayMinutes * 60 * 1000;
    expectState(hvac.state, E_HVACState.idle);
    expectGPIOState(hvac, E_HVACTrigger.idle);
    hvac.start();
    const triggerAt = new Date();
    triggerAt.setTime(triggerAt.getTime() + triggerTimeMs);
    expect(queueMock).toHaveBeenCalledTimes(0);
    hvac.queue(trigger);
    expect(queueMock).toHaveBeenCalledTimes(1);
    expect(executeMock).toHaveBeenCalledTimes(0);
    expect(hvac.nextTrigger).not.toBeNull();
    expect(hvac.nextTrigger).toHaveProperty("trigger", trigger);
    expectGPIOState(hvac, E_HVACTrigger.idle);
    expectState(hvac.state, hvac.getQueueState(trigger));
    await wait(triggerTimeMs + 10);
    expectGPIOState(hvac, trigger);
    expectState(hvac.state, hvac.getActiveState(trigger));
    expectSoftTimeCloseTo(hvac.lastRelayKill, triggerAt);
    expectSoftTimeCloseTo(hvac.lastTriggers[trigger], triggerAt);
    expect(hvac.nextTrigger).toBeNull();

    if (
      [
        E_HVACTrigger.heat,
        E_HVACTrigger.heatStage2,
        E_HVACTrigger.heatEmergency,
      ].includes(trigger)
    ) {
      expect(hvac.isIdle).toBe(false);
      expect(hvac.isHeatingAnyStage).toBe(true);
      expect(hvac.isCoolingAnyStage).toBe(false);
      expect(hvac.isCirculating).toBe(false);
    } else if (trigger === E_HVACTrigger.idle) {
      expect(hvac.isIdle).toBe(true);
      expect(hvac.isHeatingAnyStage).toBe(false);
      expect(hvac.isCoolingAnyStage).toBe(false);
      expect(hvac.isCirculating).toBe(false);
    } else if ([E_HVACTrigger.cool].includes(trigger)) {
      expect(hvac.isIdle).toBe(false);
      expect(hvac.isHeatingAnyStage).toBe(false);
      expect(hvac.isCoolingAnyStage).toBe(true);
      expect(hvac.isCirculating).toBe(false);
    } else if (trigger === E_HVACTrigger.fan) {
      expect(hvac.isIdle).toBe(false);
      expect(hvac.isHeatingAnyStage).toBe(false);
      expect(hvac.isCoolingAnyStage).toBe(false);
      expect(hvac.isCirculating).toBe(true);
    }

    if (changeTo) {
      hvac.queue(changeTo);
      if (changeTo === trigger) {
        expect(hvac.nextTrigger).toBeNull();
      } else {
        expect(hvac.nextTrigger).toHaveProperty("trigger", changeTo);
        expectState(hvac.state, hvac.getQueueState(changeTo));
      }
      await wait(triggerTimeMs + 1);
      expect(hvac.nextTrigger).toBeNull();
      expectState(hvac.state, hvac.getActiveState(changeTo));
      expectGPIOState(hvac, changeTo);
    }
    hvac.stop();

    let queueMockTimes = 1;
    let updateMockTimes = 4;
    let executeMockTimes = 1;
    if (changeTo) {
      queueMockTimes += 1;

      if (changeTo !== trigger) {
        updateMockTimes += 2;
        executeMockTimes += 1;
      }
    }

    expectGPIOState(hvac, E_HVACTrigger.idle);
    expectState(hvac.state, E_HVACState.idle);
    expect(queueMock).toHaveBeenCalledTimes(queueMockTimes);
    expect(updateMock).toHaveBeenCalledTimes(updateMockTimes);
    expect(executeMock).toHaveBeenCalledTimes(executeMockTimes);
  };

  beforeEach(() => {
    process.env.EMULATE = "true";
    const hvacConfigJson = hConfig as unknown as HVACConfigJson;
    thermostatConfig = tConfig as unknown as ThermostatConfig;
    const wires =
      hvacWireConfigurations[hvacConfigJson.wireConfiguration](
        thermostatConfig
      );
    config = {
      ...(hConfig as unknown as HVACConfig),
      controls: wires,
    };
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("Should initialize", () => {
    const hvac = new HVAC(config);
    expect(hvac.config).toEqual(config);
    expectState(hvac.state, E_HVACState.idle);
    expect(hvac.nextTrigger).toBeNull();
    expectSoftTimeCloseTo(hvac.lastRelayKill, new Date());
  });

  it("Should set all pins low", () => {
    const hvac = new HVAC(config);
    hvac.config.controls[0].gpio.on();
    hvac.config.controls[1].gpio.on();
    expect(hvac.config.controls.map((v) => v.gpio.readSync())).toEqual([
      1, 1, 0, 0, 0,
    ]);
    hvac.setPinsLow();
    expect(hvac.config.controls.map((v) => v.gpio.readSync())).toEqual([
      0, 0, 0, 0, 0,
    ]);
  });

  it("Should queue next trigger", async () => {
    const hvac = new HVAC(config);
    hvac.config.triggerDelayMinutes = 1;
    const d = new Date();
    d.setMinutes(d.getMinutes() + hvac.config.triggerDelayMinutes);
    hvac.queue(E_HVACTrigger.heat);
    const lastTrigger = hvac.lastTrigger;
    expect(hvac.nextTrigger).not.toBeNull();
    expect(hvac.nextTrigger).toHaveProperty("trigger", E_HVACTrigger.heat);
    if (hvac.nextTrigger?.at) {
      expectSoftTimeCloseTo(hvac.nextTrigger?.at, d);
    }
  });

  it("Should start idle with all pins inactive", () => {
    const hvac = new HVAC(config);
    hvac.start();
    expect(hvac.state).toBe(E_HVACState.idle);
    expectGPIOState(hvac, E_HVACTrigger.idle);
    hvac.stop();
  });

  it("Should not be able to same queue twice", async () => {
    const hvac = new HVAC(config);
    const queueMock = jest.spyOn(hvac, "queue");
    const onUpdateMock = jest.spyOn(hvac, "onUpdate");
    const executeMock = jest.spyOn(hvac, "executeNextTrigger");
    hvac.config.triggerDelayMinutes = 0.0002;
    const triggerTimeMs = hvac.config.triggerDelayMinutes * 60 * 1000;
    hvac.start();
    hvac.queue(E_HVACTrigger.heat);
    expect(hvac.state).toBe(E_HVACState.startingHeat);
    await wait(triggerTimeMs + 1);
    hvac.queue(E_HVACTrigger.heat);
    await wait(triggerTimeMs + 1);
    hvac.stop();
    expect(queueMock).toHaveBeenCalledTimes(2);
    expect(onUpdateMock).toHaveBeenCalledTimes(4);
    expect(executeMock).toHaveBeenCalledTimes(1);
  });

  describe("Simulate Combinations", () => {
    const enums = iterableEnum(E_HVACTrigger);
    const nonIdleEnums = enums.filter((f) => f !== E_HVACTrigger.idle);

    for (let e = 0; e < nonIdleEnums.length; e++) {
      const trigger = nonIdleEnums[e] as unknown as E_HVACTrigger;
      it(`Should queue/trigger ${trigger}`, async () => {
        const hvac = new HVAC(config);
        await testHVACTrigger(hvac, trigger);
      });
    }

    for (let i = 0; i < nonIdleEnums.length; i++) {
      const initialTrigger = nonIdleEnums[i];

      for (let j = 0; j < enums.length; j++) {
        const changeTrigger = enums[j];
        it(`Should change from ${initialTrigger} to ${changeTrigger}`, async () => {
          const hvac = new HVAC(config);
          await testHVACTrigger(hvac, initialTrigger, 0.0001, changeTrigger);
        });
      }
    }
  });

  // it("Simulate All Trigger Combinations", async () => {
  //   const enums = iterableEnum(E_HVACTrigger);
  //   const nonIdleEnums = enums.filter((f) => f !== E_HVACTrigger.idle);

  //   // Test idle -> trigger
  //   for (let e = 0; e < nonIdleEnums.length; e++) {
  //     const trigger = enums[e] as unknown as E_HVACTrigger;
  //     const hvac = new HVAC(config);

  //     await testHVACTrigger(hvac, trigger);
  //   }

  //   for (let i = 0; i < nonIdleEnums.length; i++) {
  //     const initialTrigger = nonIdleEnums[i];
  //     const hvac = new HVAC(config);

  //     for (let j = 0; j < enums.length; j++) {
  //       const changeTrigger = enums[j];
  //       await testHVACTrigger(hvac, initialTrigger, 0.0001, changeTrigger);
  //     }
  //   }
  // });

  // it("Should trigger heat", async () => {
  //   const hvac = new HVAC(config);
  //   await testHVACTrigger(hvac, E_HVACTrigger.heat, 0.0001);
  // });

  // it("Should trigger stage 2", async () => {
  //   const hvac = new HVAC(config);
  //   await testHVACTrigger(hvac, E_HVACTrigger.heatStage2, 0.0001);
  // });

  // it("Should trigger emergency heat", async () => {
  //   const hvac = new HVAC(config);
  //   await testHVACTrigger(hvac, E_HVACTrigger.heatEmergency, 0.0001);
  // });

  // it("Should trigger cool", async () => {
  //   const hvac = new HVAC(config);
  //   await testHVACTrigger(hvac, E_HVACTrigger.cool, 0.0001);
  // });

  // it("Should trigger circulation", async () => {
  //   const hvac = new HVAC(config);
  //   await testHVACTrigger(hvac, E_HVACTrigger.fan, 0.0001);
  // });

  // it("Should trigger idle", async () => {
  //   const hvac = new HVAC(config);
  //   await testHVACTrigger(hvac, E_HVACTrigger.heat, 0.0001);
  // });

  // it("Should transistion correctly", () => {});
});
