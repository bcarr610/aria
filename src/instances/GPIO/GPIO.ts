import { Gpio as OnOffGpio, Direction } from "onoff";

class GPIO implements I_GPIO {
  emulate: boolean;
  gpio: OnOffGpio | null;
  pin: number;
  value: 1 | 0;

  constructor(pin: number, direction: Direction) {
    this.emulate = process.env.EMULATE === "true";
    this.pin = pin;

    if (!this.emulate) {
      this.gpio = new OnOffGpio(this.pin, direction);
    } else {
      this.gpio = null;
    }

    if (direction === "high") {
      this.on();
      this.value = 1;
    } else {
      this.off();
      this.value = 0;
    }
  }

  readSync() {
    return this.gpio?.readSync() ?? this.value;
  }

  writeSync(value: 1 | 0) {
    this.gpio?.writeSync(value);
    this.value = value;
  }

  on() {
    if (this.value === 0) {
      this.writeSync(1);
    }
  }

  off() {
    if (this.value === 1) {
      this.writeSync(0);
    }
  }

  get isOn() {
    return this.value === 1;
  }
}

export default GPIO;
