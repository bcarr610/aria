import os from "node:os";
import si from "systeminformation";

class Telemetry {
  private pid: string;
  private cpu: CPUInfo | null = null;
  private totalMem: number | null = null;

  constructor() {
    this.pid = String(process.pid);
  }

  async initialize() {
    const cpu = await si.cpu();
    this.cpu = {
      manufacturer: cpu.manufacturer,
      brand: cpu.brand,
      vendor: cpu.vendor,
      speed: {
        min: cpu.speedMin,
        max: cpu.speedMax,
      },
      threads: cpu.cores,
      cores: cpu.physicalCores,
    };
    const mem = await si.mem();
    this.totalMem = mem.total;
  }

  get systemInfo(): SystemInfo | null {
    if (this.cpu && this.totalMem) {
      return {
        process: {
          pid: this.pid,
        },
        mem: {
          total: this.totalMem,
        },
        cpu: this.cpu,
      };
    }

    return null;
  }

  async stats(): Promise<TelemetryStats> {
    const [speed, temp, load, mem, procLoad] = await Promise.all([
      si.cpuCurrentSpeed(),
      si.cpuTemperature(),
      si.currentLoad(),
      si.mem(),
      si.processLoad(this.pid),
    ]);

    const pMem = process.memoryUsage();

    return {
      uptime: os.uptime(),
      cpu: {
        speed: speed.avg,
        temp: temp.main,
        sysLoad: load.currentLoad,
        procLoad: procLoad[0].cpu,
      },
      mem: {
        system: {
          used: mem.used,
          free: mem.free,
          load: mem.used / mem.total,
        },
        proc: {
          used: {
            node: pMem.heapTotal,
            app: pMem.heapUsed,
          },
          load: {
            node: pMem.heapTotal / mem.total,
            app: pMem.heapUsed / mem.total,
          },
        },
      },
    };
  }
}

export default Telemetry;
