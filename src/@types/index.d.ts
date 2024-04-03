type DHTSensorReading = {
  temperature: number;
  humidity: number;
  at: Date;
};

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

type HMS = [number, number, number];
type MDY = [number, number, number];
