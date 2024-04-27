class ThermostatSchedule {
  private _schedule: ThermostatScheduleItem[] = [];

  // TODO Move these to a global configuration so that HUB has access to this
  private minTarget = 55;
  private maxTarget = 85;

  constructor(schedule?: ThermostatScheduleItem[] | null) {
    if (schedule) {
      this.set(schedule);
    }
  }

  set(schedule: ThermostatScheduleItem[]): ThermostatScheduleItem[] {
    const now = new Date();
    const newSchedule = schedule.filter(
      (f) =>
        f.time.getTime() > now.getTime() &&
        f.target >= this.minTarget &&
        f.target <= this.maxTarget
    );
    this._schedule = newSchedule;
    this.sortSchedule();
    return this._schedule;
  }

  add(...items: ThermostatScheduleItem[]): ThermostatScheduleItem[] {
    const now = new Date();
    items.forEach((item) => {
      if (
        item.time.getTime() > now.getTime() &&
        item.target >= this.minTarget &&
        item.target <= this.maxTarget
      ) {
        this._schedule.push(item);
      }
    });
    this.sortSchedule();
    return this._schedule;
  }

  remove(...indices: (number | "first" | "last")[]) {
    const newSchedule: (ThermostatScheduleItem | null)[] = [...this._schedule];
    indices.forEach((f) => {
      if (typeof f === "number" && newSchedule[f]) {
        newSchedule[f] = null;
      } else if (f === "first") {
        newSchedule[0] = null;
      } else if (f === "last") {
        newSchedule[newSchedule.length - 1] = null;
      }
    });

    const cleanedSchedule: ThermostatScheduleItem[] = newSchedule.filter(
      (f) => f !== null
    ) as ThermostatScheduleItem[];

    this._schedule = cleanedSchedule;
    this.sortSchedule();
    return this._schedule;
  }

  get first() {
    return this._schedule?.[0] ?? [];
  }

  get last() {
    return this._schedule.length > 0
      ? this._schedule[this._schedule.length - 1]
      : [];
  }

  get list() {
    return this._schedule;
  }

  private sortSchedule() {
    this._schedule = this._schedule.sort((a, b) =>
      a.time.getTime() > b.time.getTime() ? 1 : -1
    );
  }
}

export default ThermostatSchedule;
