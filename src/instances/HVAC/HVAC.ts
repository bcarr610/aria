import { E_HVACState, E_HVACTrigger } from "../../enums";

type TriggerTimes = {
  [E_HVACTrigger.idle]: Date;
  [E_HVACTrigger.fan]: Date;
  [E_HVACTrigger.cool]: Date;
  [E_HVACTrigger.heat]: Date;
  [E_HVACTrigger.heatStage2]: Date;
  [E_HVACTrigger.heatEmergency]: Date;
};

type LastTrigger = {
  type: E_HVACTrigger;
  at: Date;
};

class HVAC {
  config: HVACConfig;
  state: E_HVACState = E_HVACState.idle;
  nextTrigger: HVACQueueItem | null = null;
  lastRelayKill: Date = new Date();
  lastTriggers: TriggerTimes = {
    [E_HVACTrigger.idle]: new Date(),
    [E_HVACTrigger.fan]: new Date(),
    [E_HVACTrigger.cool]: new Date(),
    [E_HVACTrigger.heat]: new Date(),
    [E_HVACTrigger.heatStage2]: new Date(),
    [E_HVACTrigger.heatEmergency]: new Date(),
  };
  onUpdate: (hvac: HVAC) => void = () => {};

  constructor(config: HVACConfig) {
    this.config = config;
  }

  private sendUpdate() {
    if (typeof this.onUpdate === "function") {
      this.onUpdate(this);
    }
  }

  private setPinsLow() {
    let turnedSomethingOff: boolean = false;

    this.config.controls.forEach(({ gpio }) => {
      if (gpio.isOn) {
        if (!turnedSomethingOff) turnedSomethingOff = true;
        gpio.off();
      }
    });

    if (turnedSomethingOff) this.lastRelayKill = new Date();
  }

  private getControl(trigger: E_HVACTrigger): HVACControl | null {
    return this.config.controls.find((f) => f.trigger === trigger);
  }

  get lastTrigger(): LastTrigger {
    const [key, value] = Object.entries(this.lastTriggers).sort((a, b) =>
      a > b ? 1 : -1
    )[0];
    return {
      type: key as unknown as E_HVACTrigger,
      at: value,
    };
  }

  private getActiveState(trigger: E_HVACTrigger): E_HVACState {
    switch (trigger) {
      case E_HVACTrigger.cool:
        return E_HVACState.cooling;
      case E_HVACTrigger.fan:
        return E_HVACState.blowing;
      case E_HVACTrigger.heat:
        return E_HVACState.heating;
      case E_HVACTrigger.heatStage2:
        return E_HVACState.heatingStage2;
      case E_HVACTrigger.heatEmergency:
        return E_HVACState.heatingEmergency;
      case E_HVACTrigger.idle:
      default:
        return E_HVACState.idle;
    }
  }

  private getQueueState(trigger: E_HVACTrigger): E_HVACState {
    switch (trigger) {
      case E_HVACTrigger.cool:
        return E_HVACState.startingToCool;
      case E_HVACTrigger.fan:
        return E_HVACState.startingFan;
      case E_HVACTrigger.heat:
        return E_HVACState.startingHeat;
      case E_HVACTrigger.heatStage2:
        return E_HVACState.startingHeatStage2;
      case E_HVACTrigger.heatEmergency:
        return E_HVACState.startingEmergencyHeat;
      case E_HVACTrigger.idle:
      default:
        return E_HVACState.startingIdle;
    }
  }

  private getNewQueueTriggerTime(trigger: E_HVACTrigger, at: Date): Date {
    const d = new Date(at);
    const nextAvailableNonIdleTime =
      this.lastRelayKill.getTime() +
      this.config.triggerDelayMinutes * 60 * 1000;
    if (trigger !== E_HVACTrigger.idle) {
      if (d.getTime() < nextAvailableNonIdleTime) {
        d.setTime(nextAvailableNonIdleTime);
      }
    }

    return d;
  }

  get isIdle() {
    return this.state === E_HVACState.idle;
  }

  get isHeatingAnyStage() {
    return [
      E_HVACState.heating,
      E_HVACState.heatingStage2,
      E_HVACState.heatingEmergency,
    ].includes(this.state);
  }

  get isCoolingAnyStage() {
    return [E_HVACState.cooling].includes(this.state);
  }

  get isCirculating() {
    return this.state === E_HVACState.blowing;
  }

  executeNextTrigger() {
    this.setPinsLow();
    if (this.nextTrigger) {
      this.lastTriggers[this.nextTrigger.trigger] = new Date();
      if (this.nextTrigger.control) this.nextTrigger.control.gpio.on();
      this.state = this.getActiveState(this.nextTrigger.trigger);
      this.nextTrigger = null;
    }
    this.sendUpdate();
  }

  queue(trigger: E_HVACTrigger, at: Date = new Date()) {
    if (this.canQueue(trigger)) {
      // If not idle and trying to trigger non-idle state, kill relays before queue
      if (this.state !== E_HVACState.idle && trigger !== E_HVACTrigger.idle) {
        this.setPinsLow();
      }

      // Calculate the execution time based on config and last relay off state
      let triggerAt: Date = this.getNewQueueTriggerTime(trigger, at);

      // Queue the next trigger event
      const control = this.getControl(trigger);
      this.nextTrigger = {
        trigger,
        control,
        at: triggerAt,
      };

      // Update State
      this.state = this.getQueueState(trigger);
      this.sendUpdate();
    }
  }

  canQueue(trigger: E_HVACTrigger): boolean {
    switch (trigger) {
      case E_HVACTrigger.idle:
        return (
          this.state !== E_HVACState.idle &&
          this.state !== E_HVACState.startingIdle
        );
      case E_HVACTrigger.fan:
        return (
          this.state !== E_HVACState.blowing &&
          this.state !== E_HVACState.startingFan
        );
      case E_HVACTrigger.cool:
        return (
          this.state !== E_HVACState.cooling &&
          this.state !== E_HVACState.startingToCool
        );
      case E_HVACTrigger.heat:
        return (
          this.state !== E_HVACState.heating &&
          this.state !== E_HVACState.startingHeat &&
          this.state !== E_HVACState.startingHeatStage2 &&
          this.state !== E_HVACState.heatingStage2 &&
          this.state !== E_HVACState.startingEmergencyHeat &&
          this.state !== E_HVACState.heatingEmergency
        );
      case E_HVACTrigger.heatStage2:
        return (
          this.state !== E_HVACState.startingHeatStage2 &&
          this.state !== E_HVACState.heatingStage2 &&
          this.state !== E_HVACState.startingEmergencyHeat &&
          this.state !== E_HVACState.heatingEmergency
        );
      case E_HVACTrigger.heatEmergency:
        return (
          this.state !== E_HVACState.startingEmergencyHeat &&
          this.state !== E_HVACState.heatingEmergency
        );
      default:
        return false;
    }
  }
}

export default HVAC;
