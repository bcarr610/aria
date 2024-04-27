import HVAC from "../HVAC/HVAC";
import DHTSensor from "../DHTSensor/DHTSensor";
import { dateToMDY, getHMSTime, greatest, mdyIsToday, timeToMs } from "../../utils/utils";
import ThermostatStore from "../../stores/ThermostatStore";

class ThermostatController {
  private idleSpeed: number = 0;
  private currentSpeed: number = 0;
  private clock: NodeJS.Timeout | null = null;
  private store: ThermostatStore;
  private hvac: HVAC;
  private dhtSensor: DHTSensor;
  _onUpdate: (data: ThermostatStoreData) => void = () => {};

  constructor(
    store: ThermostatStore,
    dhtSensor: DHTSensor,
    hvac: HVAC,
    onData: (data: ThermostatStoreData) => void
  ) {
    this.dhtSensor = dhtSensor;
    this.hvac = hvac;
    this.store = store;

    this._onUpdate = onData;
    this._onUpdate = this._onUpdate.bind(this);

    this.sendUpdate();
  }

  private sendUpdate() {
    this._onUpdate(this.store.data);
  }

  async setMode(mode: ThermostatMode) {
    if (mode !== this.store.data.mode) {
      this.store.data.mode = mode;
      await this.store.save();

      if (mode !== "auto") {
        this.hvac.queue(mode);
      }

      this.sendUpdate();
    }
  }

  private async activateNextScheduleItem() {
    const { target } = this.store.data.schedule[0];
    const schedule = this.store.data.schedule.slice(1);
    this.store.data.schedule = schedule;
    this.store.data.target = target;
    await this.store.save();
    this.sendUpdate();
  }

  private async activateRoutine(idx: number) {
    const routines = this.store.data.routines;
    const routine = routines[idx];
    if (routine) {
      const { target, energyMode } = routine;
      const newState: Partial<ThermostatStoreData> = { routines };
      if (target) newState.target = target;
      if (energyMode) newState.energyMode = energyMode;
      if (newState.routines?.[idx]) {
        newState.routines[idx].lastActivated = dateToMDY();
      }
      this.store.data = {
        ...this.store.data,
        ...newState,
      };

      await this.store.save();
      this.sendUpdate();
    }
  }

  get mode() {
    return this.store.data.mode;
  }

  get target() {
    return this.store.data.target;
  }

  get energyMode() {
    return this.store.data.energyMode;
  }

  get isSpeedStable() {
    const now = new Date();
    const { lastActive, lastInactive } = this.hvac.times[this.hvac.state];
    const lastStateTime = greatest(lastActive, lastInactive);
    return now.getTime() > lastStateTime + this.store.data.delaySpeedCalculation;
  }

  get preferredAction(): HVACState | null {
    const now = new Date().getTime();
    const temp = this.dhtSensor.avg.temperature;
    const hvacState = this.hvac.state;
    const energyMode = this.energyMode;
    const targetPadding = this.store.data.targetPadding?.[energyMode] ?? 1;
    const targetReachOffset = this.store.data.targetReachOffset;
    const auxHeat = this.store.data.auxHeat?.[energyMode];
    const circulate = this.store.data.circulate?.[energyMode];

    if (
      hvacState !== "IDLE" &&
      this.hvac.times[hvacState].lastActive + this.store.data.maxRuntime <= now
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
            if (now - lastIdle > circulate.every) {
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
          now - this.hvac.times.CIRCULATE.lastActive > circulate.for
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
    if (this.store.data.schedule.length) {
      const { target, time } = this.store.data.schedule[0];

      if (now >= time) {
        await this.activateNextScheduleItem();
      }
    }

    if (this.store.data.routines.length) {
      const foundActivationIdx = this.store.data.routines.findIndex((f) => {
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

    this.clock = setInterval(this.tick.bind(this), this.store.data.clockSpeed);
  }

  stop() {
    if (this.clock !== null) {
      clearInterval(this.clock);
      this.clock = null;
    }
  }
}

export default ThermostatController;
