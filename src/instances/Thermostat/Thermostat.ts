import HVAC from "../HVAC/HVAC";
import DHTSensor from "../DHTSensor/DHTSensor";
import { greatest, timeToMs } from "../../utils/utils";
import ThermostatSchedule from "../ThermostatSchedule";

export const defaultOpts: ThermostatOptions = {
  clockSpeed: {
    unit: "SECONDS",
    value: 1,
  },
  targetReachOffset: 0.4,
  delaySpeedCalculation: {
    unit: "MINUTES",
    value: 7,
  },
  auxHeatSpeedBelow: 0.5,
  auxHeatTempFromTargetBelow: 8,
  targetPadding: 1,
  circulateFor: {
    unit: "MINUTES",
    value: 30,
  },
  circulateEvery: {
    unit: "HOURS",
    value: 1,
  },
};

class Thermostat {
  private _target: number = 72;
  private idleSpeed: number = 0;
  private currentSpeed: number = 0;
  private _mode: ThermostatMode = "auto";
  energyMode: EnergyMode = "normal";
  schedule: ThermostatSchedule;
  private clock: NodeJS.Timeout | null = null;
  private clockSpeed: number;
  private targetReachOffset: number;
  private delaySpeedCalculation: number;
  private auxHeatSpeedBelow: number | false;
  private auxHeatTempFromTargetBelow: number | false;
  private targetPadding: number;
  private circulateFor: number | false;
  private circulateEvery: number | false;
  private hvac: HVAC;
  private dhtSensor: DHTSensor;

  constructor(
    dhtSensor: DHTSensor,
    hvac: HVAC,
    schedule?: ThermostatScheduleItem[] | null,
    opts?: ThermostatOptions
  ) {
    const {
      clockSpeed,
      targetReachOffset,
      delaySpeedCalculation,
      auxHeatSpeedBelow,
      auxHeatTempFromTargetBelow,
      targetPadding,
      circulateFor,
      circulateEvery,
    } = defaultOpts;
    this.clockSpeed = timeToMs(opts?.clockSpeed ?? clockSpeed);
    this.targetReachOffset = opts?.targetReachOffset ?? targetReachOffset;
    this.delaySpeedCalculation = timeToMs(
      opts?.delaySpeedCalculation ?? delaySpeedCalculation
    );
    this.auxHeatSpeedBelow = opts?.auxHeatSpeedBelow ?? auxHeatSpeedBelow;
    this.auxHeatTempFromTargetBelow =
      opts?.auxHeatTempFromTargetBelow ?? auxHeatTempFromTargetBelow;
    this.targetPadding = opts?.targetPadding ?? targetPadding;
    this.circulateFor = timeToMs(opts?.circulateFor ?? circulateFor);
    this.circulateEvery = timeToMs(opts?.circulateEvery ?? circulateEvery);

    this.dhtSensor = dhtSensor;
    this.hvac = hvac;
    this.schedule = new ThermostatSchedule(schedule);
  }

  set mode(mode: ThermostatMode) {
    this._mode = mode;
    if (this._mode !== "auto") {
      this.hvac.queue(this._mode);
    }
  }

  set target(target: number) {
    if (target > 50 && target < 90) {
      this._target = target;
    }
  }

  get mode() {
    return this._mode;
  }

  get target() {
    return this._target;
  }

  get isSpeedStable() {
    const now = new Date();
    const { lastActive, lastInactive } = this.hvac.times[this.hvac.state];
    const lastStateTime = greatest(lastActive, lastInactive);
    return now.getTime() > lastStateTime.getTime() + this.delaySpeedCalculation;
  }

  get preferredAction(): HVACState | null {
    const now = new Date().getTime();
    const temp = this.dhtSensor.avg.temperature;
    const hvacState = this.hvac.state;

    if (this.isSpeedStable) {
      if (hvacState === "IDLE") {
        // Heat or cool?
        if (temp < this.target - this.targetPadding) {
          // Should activate aux heat from idle?
          if (
            this.auxHeatTempFromTargetBelow &&
            this.target - temp >= this.auxHeatTempFromTargetBelow
          ) {
            return "HEAT_AUX";
          }

          return "HEAT";
        } else if (temp > this.target + this.targetPadding) {
          return "COOL";
        } else {
          // Should circulate?
          if (this.circulateEvery) {
            const lastIdle = this.hvac.times.IDLE.lastActive;
            if (now - lastIdle.getTime() > this.circulateEvery) {
              return "CIRCULATE";
            }

            return null;
          }

          return null;
        }
      } else {
        // Should trigger auxHeat?
        if (
          hvacState === "HEAT" &&
          this.auxHeatSpeedBelow &&
          this.currentSpeed < this.auxHeatSpeedBelow
        ) {
          return "HEAT_AUX";
        }
        // Should stop circulating?
        else if (
          hvacState === "CIRCULATE" &&
          this.circulateFor &&
          now - this.hvac.times.CIRCULATE.lastActive.getTime() >
            this.circulateFor
        ) {
          return "IDLE";
        }
        // Should stop heating?
        else if (
          hvacState === "HEAT" &&
          temp >= this.target + this.targetReachOffset
        ) {
          return "IDLE";
        }
        // Should stop cooling?
        else if (
          hvacState === "COOL" &&
          temp <= this.target - this.targetReachOffset
        ) {
          return "IDLE";
        }

        return null;
      }
    }

    return null;
  }

  private tick() {
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
    if (this.schedule.list.length) {
      const { target, time } = this.schedule.first;

      if (now >= time.getTime()) {
        this.target = target;
        this.schedule.remove("first");
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
          this.hvac.queue("CIRCULATE");
        case "COOL":
          this.hvac.queue("COOL");
        case "HEAT":
          this.hvac.queue("HEAT");
        case "HEAT_AUX":
          this.hvac.queue("HEAT_AUX");
        case "IDLE":
        default:
          this.hvac.queue("IDLE");
      }
    }
  }

  start() {
    if (this.clock !== null) {
      clearInterval(this.clock);
      this.clock = null;
    }

    this.clock = setInterval(this.tick.bind(this), this.clockSpeed);
  }

  stop() {
    if (this.clock !== null) {
      clearInterval(this.clock);
      this.clock = null;
    }
  }
}

export default Thermostat;
