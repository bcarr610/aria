class Interval {
  speedMS: number;
  interval: NodeJS.Timeout | null = null;
  handler: () => void;

  constructor(speedMS: number, handler: () => void) {
    this.speedMS = speedMS;
    this.handler = handler;
  }

  private clearInterval() {
    if (this.interval !== null) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  start(immediate: boolean = true) {
    this.clearInterval();
    if (immediate) this.handler();
    this.interval = setInterval(this.handler, this.speedMS);
  }

  stop() {
    this.clearInterval();
  }
}

export default Interval;
