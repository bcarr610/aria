type SystemInfo = {
  process: ProcessInfo;
  cpu: CPUInfo;
  mem: MEMInfo;
};

type ProcessInfo = {
  pid: string;
};

type CPUInfo = {
  manufacturer: string;
  brand: string;
  vendor: string;
  speed: {
    min: number;
    max: number;
  };
  threads: number;
  cores: number;
};

type MEMInfo = {
  total: number;
};

type TelemetryStats = {
  uptime: number;
  cpu: {
    speed: number;
    temp: number;
    sysLoad: number;
    procLoad: number;
  };
  mem: {
    system: {
      used: number;
      free: number;
      load: number;
    };
    proc: {
      used: {
        node: number;
        app: number;
      };
      load: {
        node: number;
        app: number;
      };
    };
  };
};
