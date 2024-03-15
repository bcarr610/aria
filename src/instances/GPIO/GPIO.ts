class GPIO implements I_GPIO {
  name: string;
  pin: number;
  state: 1 | 0;

  constructor(name: string, pin: number) {
    this.name = name;
    this.pin = pin;
  }

  on() {
    if (!this.state) {
      // TODO Activate pin
      this.state = 1;
    }
  }

  off() {
    if (this.state) {
      // TODO Deactivate pin
      this.state = 0;
    }
  }

  get isOn() {
    return this.state === 1;
  }
}

export default GPIO;
