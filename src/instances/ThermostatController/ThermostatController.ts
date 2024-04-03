import HVAC from "../HVAC/HVAC";
import DHTSensor from "../DHTSensor/DHTSensor";
import { dateToMDY, getHMSTime, greatest, mdyIsToday, timeToMs } from "../../utils/utils";
import PersistentStateMachine from "../PersistentStateMachine/PersistentStateMachine";

class ThermostatController {
  private idleSpeed: number = 0;
  private currentSpeed: number = 0;
  private state: PersistentStateMachine<ThermostatPersistentState>;
  private clock: NodeJS.Timeout | null = null;
  private hvac: HVAC;
  private dhtSensor: DHTSensor;
  onLoad: (data: ThermostatUpdateData) => void = () => {};
  onUpdate: (data: ThermostatUpdateData) => void = () => {};

  constructor(
    persistentStateMachine: PersistentStateMachine<ThermostatPersistentState>,
    dhtSensor: DHTSensor,
    hvac: HVAC
  ) {
    this.dhtSensor = dhtSensor;
    this.hvac = hvac;
    this.state = persistentStateMachine;
    this.state.on("change", this.sendUpdate.bind(this));
    this.hvac.stateMachine.on("change", this.sendUpdate.bind(this));
    this.dhtSensor.state.on("change", this.sendUpdate.bind(this));
    this.onLoad(this.data);
  }

  get data(): ThermostatUpdateData {
    return {
      thermostat: {
        idleSpeed: this.idleSpeed,
        currentSpeed: this.currentSpeed,
        state: this.state.values,
      },
      hvac: {
        state: this.hvac.state,
        currentState: this.hvac.stateMachine.values,
        nextAction: this.hvac.nextAction,
        times: this.hvac.times,
        components: this.hvac.componentState,
      },
      dht: {
        temperature: this.dhtSensor.avgTemp,
        humidity: this.dhtSensor.avgHumid,
        speed: this.dhtSensor.speed,
        state: this.dhtSensor.state.values,
      },
    };
  }

  private sendUpdate() {
    if (typeof this.onUpdate === "function") {
      this.onUpdate(this.data);
    }
  }

  async setMode(mode: ThermostatMode) {
    if (mode !== this.state.values.mode) {
      await this.state.update({ mode });

      if (mode !== "auto") {
        this.hvac.queue(mode);
      }
    }
  }

  private async activateNextScheduleItem() {
    const { target } = this.state.values.schedule[0];
    const schedule = this.state.values.schedule.slice(1);
    await this.state.update({ schedule, target });
  }

  private async activateRoutine(idx: number) {
    const routines = this.state.values.routines;
    const routine = routines[idx];
    if (routine) {
      const { target, energyMode } = routine;
      const newState: Partial<ThermostatPersistentState> = { routines };
      if (target) newState.target = target;
      if (energyMode) newState.energyMode = energyMode;
      if (newState.routines?.[idx]) {
        newState.routines[idx].lastActivated = dateToMDY();
      }

      await this.state.update(newState);
    }
  }

  get mode() {
    return this.state.values.mode;
  }

  get target() {
    return this.state.values.target;
  }

  get energyMode() {
    return this.state.values.energyMode;
  }

  get isSpeedStable() {
    const now = new Date();
    const { lastActive, lastInactive } = this.hvac.times[this.hvac.state];
    const lastStateTime = greatest(lastActive, lastInactive);
    return now.getTime() > lastStateTime + timeToMs(this.state.values.delaySpeedCalculation);
  }

  get preferredAction(): HVACState | null {
    const now = new Date().getTime();
    const temp = this.dhtSensor.avg.temperature;
    const hvacState = this.hvac.state;
    const energyMode = this.energyMode;
    const targetPadding = this.state.values.targetPadding?.[energyMode] ?? 1;
    const targetReachOffset = this.state.values.targetReachOffset;
    const auxHeat = this.state.values.auxHeat?.[energyMode];
    const circulate = this.state.values.circulate?.[energyMode];

    if (
      hvacState !== "IDLE" &&
      this.hvac.times[hvacState].lastActive + timeToMs(this.state.values.maxRuntime) <= now
    ) {
      return "IDLE";
    }

    if (this.isSpeedStable) {
      if (hvacState === "IDLE") {
        // Heat or cool?
        if (temp < this.target - targetPadding) {
          // Should activate aux heat from idle?
          if (auxHeat?.belowTempFromTarget && this.target - temp >= auxHeat.belowTempFromTarget) {
            return "HEAT_AUX";
          }

          return "HEAT";
        } else if (temp > this.target + targetPadding) {
          return "COOL";
        } else {
          // Should circulate?
          if (circulate) {
            const lastIdle = this.hvac.times.IDLE.lastActive;
            if (now - lastIdle > timeToMs(circulate.every)) {
              return "CIRCULATE";
            }

            return null;
          }

          return null;
        }
      } else {
        // Should trigger auxHeat?
        if (hvacState === "HEAT" && auxHeat?.belowSpeed && this.currentSpeed < auxHeat.belowSpeed) {
          return "HEAT_AUX";
        }
        // Should stop circulating?
        else if (
          hvacState === "CIRCULATE" &&
          circulate &&
          now - this.hvac.times.CIRCULATE.lastActive > timeToMs(circulate.for)
        ) {
          return "IDLE";
        }
        // Should stop heating?
        else if (hvacState === "HEAT" && temp >= this.target + targetReachOffset) {
          return "IDLE";
        }
        // Should stop cooling?
        else if (hvacState === "COOL" && temp <= this.target - targetReachOffset) {
          return "IDLE";
        }

        return null;
      }
    }

    return null;
  }

  private async tick() {
    const now = new Date().getTime();
    this.dhtSensor.clock();
    this.hvac.clock();

    // Should record temperature speed?
    if (this.isSpeedStable) {
      if (this.hvac.state === "IDLE") {
        this.idleSpeed = this.dhtSensor.speed;
      }

      this.currentSpeed = this.dhtSensor.speed;
    }

    // Should activate something from schedule?
    if (this.state.values.schedule.length) {
      const { target, time } = this.state.values.schedule[0];

      if (now >= time) {
        await this.activateNextScheduleItem();
      }
    }

    if (this.state.values.routines.length) {
      const foundActivationIdx = this.state.values.routines.findIndex((f) => {
        if (f.active === 0) return false;
        if (f.lastActivated !== null && mdyIsToday(f.lastActivated)) return false;
        const activateAt = getHMSTime(f.hms);
        if (now > activateAt) {
          return true;
        }
      });

      if (foundActivationIdx !== -1) {
        await this.activateRoutine(foundActivationIdx);
      }
    }

    // Should queue HVAC event?
    if (this.mode === "auto") {
      const preferred = this.preferredAction;
      if (preferred !== null) {
        this.hvac.queue(preferred);
      }
    } else {
      switch (this.mode) {
        case "CIRCULATE":
          if (this.hvac.state !== "CIRCULATE") {
            this.hvac.queue("CIRCULATE");
          }
          break;
        case "COOL":
          if (this.hvac.state !== "COOL") {
            this.hvac.queue("COOL");
          }
          break;
        case "HEAT":
          if (this.hvac.state !== "HEAT") {
            this.hvac.queue("HEAT");
          }
          break;
        case "HEAT_AUX":
          if (this.hvac.state !== "HEAT_AUX") {
            this.hvac.queue("HEAT_AUX");
          }
          break;
        case "IDLE":
        default:
          if (this.hvac.state !== "IDLE") {
            this.hvac.queue("IDLE");
          }
          break;
      }
    }
  }

  start() {
    if (this.clock !== null) {
      clearInterval(this.clock);
      this.clock = null;
    }

    this.clock = setInterval(this.tick.bind(this), timeToMs(this.state.values.clockSpeed));
  }

  stop() {
    if (this.clock !== null) {
      clearInterval(this.clock);
      this.clock = null;
    }
  }
}

export default ThermostatController;
