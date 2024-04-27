import { Gpio as OnOffGpio, Direction } from "onoff";

class GPIO {
  gpio: OnOffGpio | null = null;
  private pin: number;
  private direction: Direction;
  private _value: number = 0;
  lastHighTime: Date = new Date();
  lastLowTime: Date = new Date();
  lastValueChange: Date = new Date();

  constructor(pin: number, direction: Direction = "out") {
    this.pin = pin;
    this.direction = direction;
    this.gpio = new OnOffGpio(this.pin, direction);

    if (direction === "high") {
      this.gpio?.writeSync(1);
      this.updateValue(1);
    } else if (direction !== "in") {
      this.gpio?.writeSync(0);
      this.updateValue(0);
    } else {
      const val = this.gpio?.readSync() ?? 0;
      this.updateValue(val);
    }
  }

  get value(): number {
    const val = this.gpio?.readSync() ?? this._value;
    this.updateValue(val);
    return this._value;
  }

  set value(val: 1 | 0) {
    this.gpio?.writeSync(val);
    this.updateValue(val);
  }

  private updateValue(newValue: number) {
    if (newValue !== this._value) {
      this.lastValueChange = new Date();
      if (newValue === 1) this.lastHighTime = new Date();
      else if (newValue === 0) this.lastLowTime = new Date();
      this._value = newValue;
    }
  }
}

export default GPIO;
