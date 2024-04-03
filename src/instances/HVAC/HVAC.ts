import { clamp, timeToMs } from "../../utils";
import GPIO from "../GPIO";
import PersistentStateMachine from "../PersistentStateMachine";

class HVAC {
  state: HVACState;
  nextAction: NextHVACAction | null = null;
  stateMachine: PersistentStateMachine<HVACPersistentState>;
  private components: HVACComponents;

  constructor(persistentStateMachine: PersistentStateMachine<HVACPersistentState>) {
    this.state = "IDLE";
    this.stateMachine = persistentStateMachine;
    const wires = this.stateMachine.values.gpioWire;
    this.components = {
      compressor: new GPIO(wires.compressor),
      heatPump: new GPIO(wires.heatPump),
      auxHeat: new GPIO(wires.auxHeat),
      fan: new GPIO(wires.fan),
    };
    this.idle();
  }

  get times() {
    return this.stateMachine.values.times;
  }

  get minIdleTime() {
    return timeToMs(this.stateMachine.values.minIdleTime);
  }

  get minCycleTime() {
    return timeToMs(this.stateMachine.values.minCycleTime);
  }

  get componentState() {
    return {
      compressor: this.components.compressor.value === 1,
      fan: this.components.fan.value === 1,
      heatPump: this.components.heatPump.value === 1,
      auxHeat: this.components.auxHeat.value === 1,
    };
  }

  private on(name: HVACComponentName) {
    this.components[name].value = 1;
  }

  private off(name: HVACComponentName) {
    this.components[name].value = 0;
  }

  private get minWaitTimeReachedAt(): number {
    const now = new Date().getTime();
    const elapsed = now - (this.times?.[this.state]?.lastActive ?? 0);
    const waitTime = this.state === "IDLE" ? this.minIdleTime : this.minCycleTime;
    const addTime = clamp(waitTime - elapsed, [0]);
    const d = new Date(now);
    d.setTime(d.getTime() + addTime);
    return d.getTime();
  }

  private async updateState(state: HVACState) {
    this.stateMachine.update({
      times: {
        [state]: {
          lastActive: new Date().getTime(),
        },
        [this.state]: {
          lastInactive: new Date().getTime(),
        },
      },
    });
    this.state = state;
  }

  private async idle() {
    this.off("compressor");
    this.off("heatPump");
    this.off("auxHeat");
    this.off("fan");
    await this.updateState("IDLE");
  }

  private async circulate() {
    this.off("compressor");
    this.off("heatPump");
    this.off("auxHeat");
    this.on("fan");
    this.updateState("CIRCULATE");
  }

  private async cool() {
    this.on("compressor");
    this.off("heatPump");
    this.off("auxHeat");
    this.on("fan");
    await this.updateState("COOL");
  }

  private async heat() {
    this.off("compressor");
    this.on("heatPump");
    this.off("auxHeat");
    this.on("fan");
    await this.updateState("HEAT");
  }

  private async auxHeat() {
    this.off("compressor");
    this.on("heatPump");
    this.on("auxHeat");
    this.on("fan");
    await this.updateState("HEAT_AUX");
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
        queueAction.at = new Date().getTime();
        queueAction.idleFirst = false;
      }

      // Don't idle first when switching to circulate
      if (newState === "CIRCULATE") {
        queueAction.idleFirst = false;
      }

      this.nextAction = queueAction;
    }
  }

  async clock() {
    if (this.nextAction) {
      const now = new Date().getTime();
      if (now > this.nextAction.at) {
        if (this.nextAction.idleFirst) {
          await this.idle();
          const nextState = this.nextAction.state;
          const at = new Date();
          at.setTime(at.getTime() + this.minIdleTime);
          this.nextAction = {
            state: nextState,
            at: at.getTime(),
            idleFirst: false,
          };
        } else {
          const trigger = this.nextAction.state;
          if (trigger === "IDLE") await this.idle();
          else if (trigger === "CIRCULATE") await this.circulate();
          else if (trigger === "COOL") await this.cool();
          else if (trigger === "HEAT") await this.heat();
          else if (trigger === "HEAT_AUX") await this.auxHeat();
          this.nextAction = null;
        }
      }
    }
  }
}

export default HVAC;
