import wpi from "wiring-pi";

wpi.setup("wpi");

type GPIOMode = "in" | "out";
type GPIOType = "digital" | "analog";

class GPIO {
  private pin: number;
  private mode: GPIOMode;
  private type: GPIOType;
  private _value: number = 0;
  lastHighTime: Date = new Date();
  lastLowTime: Date = new Date();
  lastValueChange: Date = new Date();

  constructor(pin: number, mode: GPIOMode = "out", type: GPIOType = "digital") {
    this.pin = pin;
    this.mode = mode;
    this.type = type;
    wpi.pinMode(this.pin, this.mode === "out" ? wpi.OUTPUT : wpi.INPUT);
  }

  get value(): number {
    if (this.type === "analog") {
      return wpi.analogRead(this.pin);
    }
    return wpi.digitalRead(this.pin);
  }

  set value(val: number) {
    if (this.type === "analog") {
      wpi.analogWrite(this.pin, val);
    } else {
      wpi.digitalWrite(this.pin, val);
    }
  }
}

export default GPIO;
