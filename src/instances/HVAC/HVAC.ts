import { clamp } from "../../utils";
import GPIO from "../GPIO";

class HVAC {
  state: HVACState;
  nextAction: NextHVACAction | null = null;
  times: HVACStateTimes;
  private transitionTime: number;
  private minCycleTime: number;
  private components: HVACComponents;
  private _onUpdate: (data: HVACUpdateData) => void = () => {};

  constructor(
    transitionTime: number,
    minCycleTime: number,
    compressor: GPIO,
    heatPump: GPIO,
    auxHeat: GPIO,
    fan: GPIO
  ) {
    this.state = "IDLE";
    this.transitionTime = transitionTime;
    this.minCycleTime = minCycleTime;
    this.components = {
      compressor,
      heatPump,
      auxHeat,
      fan,
    };
    this.times = {
      IDLE: { lastActive: new Date(), lastInactive: new Date() },
      CIRCULATE: { lastActive: new Date(), lastInactive: new Date() },
      COOL: { lastActive: new Date(), lastInactive: new Date() },
      HEAT: { lastActive: new Date(), lastInactive: new Date() },
      HEAT_AUX: { lastActive: new Date(), lastInactive: new Date() },
    };
    this.idle();
  }

  set onUpdate(fn: (data: HVACUpdateData) => void) {
    this._onUpdate = fn;
  }

  private sendUpdate() {
    if (typeof this._onUpdate === "function") {
      this._onUpdate({
        state: this.state,
        nextAction: this.nextAction,
        times: this.times,
        components: {
          compressor: {
            lastActiveTime: this.components.compressor.lastHighTime,
            lastInactiveTime: this.components.compressor.lastLowTime,
            isActive: this.components.compressor.value === 1,
          },
          heatPump: {
            lastActiveTime: this.components.heatPump.lastHighTime,
            lastInactiveTime: this.components.heatPump.lastLowTime,
            isActive: this.components.heatPump.value === 1,
          },
          auxHeat: {
            lastActiveTime: this.components.auxHeat.lastHighTime,
            lastInactiveTime: this.components.auxHeat.lastLowTime,
            isActive: this.components.auxHeat.value === 1,
          },
          fan: {
            lastActiveTime: this.components.fan.lastHighTime,
            lastInactiveTime: this.components.fan.lastLowTime,
            isActive: this.components.fan.value === 1,
          },
        },
      });
    }
  }

  private on(name: HVACComponentName) {
    this.components[name].value = 1;
  }

  private off(name: HVACComponentName) {
    this.components[name].value = 0;
  }

  private get minWaitTimeReachedAt(): Date {
    const now = new Date().getTime();
    const elapsed = now - this.times[this.state].lastActive.getTime();
    const waitTime =
      this.state === "IDLE" ? this.transitionTime : this.minCycleTime;
    const addTime = clamp(waitTime - elapsed, [0]);
    const d = new Date(now);
    d.setTime(d.getTime() + addTime);
    return d;
  }

  private idle() {
    this.times.IDLE.lastActive = new Date();
    this.times[this.state].lastInactive = new Date();
    this.off("compressor");
    this.off("heatPump");
    this.off("auxHeat");
    this.off("fan");
    this.state = "IDLE";
    this.sendUpdate();
  }

  private circulate() {
    this.times.CIRCULATE.lastActive = new Date();
    this.times[this.state].lastInactive = new Date();
    this.off("compressor");
    this.off("heatPump");
    this.off("auxHeat");
    this.on("fan");
    this.state = "CIRCULATE";
    this.sendUpdate();
  }

  private cool() {
    this.times.COOL.lastActive = new Date();
    this.times[this.state].lastInactive = new Date();
    this.on("compressor");
    this.off("heatPump");
    this.off("auxHeat");
    this.on("fan");
    this.state = "COOL";
    this.sendUpdate();
  }

  private heat() {
    this.times.HEAT.lastActive = new Date();
    this.times[this.state].lastInactive = new Date();
    this.off("compressor");
    this.on("heatPump");
    this.off("auxHeat");
    this.on("fan");
    this.state = "HEAT";
    this.sendUpdate();
  }

  private auxHeat() {
    this.times.HEAT_AUX.lastActive = new Date();
    this.times[this.state].lastInactive = new Date();
    this.off("compressor");
    this.on("heatPump");
    this.on("auxHeat");
    this.on("fan");
    this.state = "HEAT_AUX";
    this.sendUpdate();
  }

  queue(newState: HVACState) {
    if (this.state !== newState) {
      const queueAction: NextHVACAction = {
        state: newState,
        at: this.minWaitTimeReachedAt,
        idleFirst: newState !== "IDLE" && this.state !== "IDLE",
      };

      // Queue immediately if activating aux heat from heat
      if (newState === "HEAT_AUX" && this.state === "HEAT") {
        queueAction.at = new Date();
        queueAction.idleFirst = false;
      }

      // Don't idle first when switching to circulate
      if (newState === "CIRCULATE") {
        queueAction.idleFirst = false;
      }

      this.nextAction = queueAction;
    }
  }

  clock() {
    if (this.nextAction) {
      const now = new Date();
      if (now.getTime() > this.nextAction.at.getTime()) {
        if (this.nextAction.idleFirst) {
          this.idle();
          const nextState = this.nextAction.state;
          const at = new Date();
          at.setTime(at.getTime() + this.transitionTime);
          this.nextAction = {
            state: nextState,
            at,
            idleFirst: false,
          };
        } else {
          const trigger = this.nextAction.state;
          if (trigger === "IDLE") this.idle();
          else if (trigger === "CIRCULATE") this.circulate();
          else if (trigger === "COOL") this.cool();
          else if (trigger === "HEAT") this.heat();
          else if (trigger === "HEAT_AUX") this.auxHeat();
          this.nextAction = null;
        }
      }
    }
  }
}

export default HVAC;
