type UserId = string;
type DeviceId = string;
type UserSessionToken = string;
type DeviceSessionToken = string;
type HubToken = string;
type HubAccessKey = string;
type Email = `${string}@${string}.${string}`;
type PasswordSecret = `${string}_${string}`;

type AriaDeviceType = "hub" | "window" | "thermostat";

type UserRights = {
  contentAgeLimit: number | "none";
  deviceControl: AriaDeviceType[] | "*";
  deviceView: AriaDeviceType[] | "*";
  canCreateUsers: boolean;
};

type DeviceConfiguration = {
  canConnectToHub: boolean;
  canReadTelemetry: boolean;
  canAuthorizeNewDevice: boolean;
  canReadLogs: boolean;
};

type RegisteredDevice = {
  id: DeviceId;
  type: AriaDeviceType;
  name: string;
  room: string | null;
  groups: string[];
  favorite: boolean;
  online: boolean;
  config: DeviceConfiguration;
  registrationState: "pending" | "registered";
  registrationTime: number | null;
  lastConnectedState: 0 | 1;
  lastConnectedStateTime: number;
  ip: string | undefined;
  port: number;
};

type EmailVerificationToken = {
  expires: number;
  userId: UserId;
  token: string;
  verified: boolean;
};

type UserToken = {
  token: string;
  expires: number;
  created: number;
};

type User = {
  id: UserId;
  firstName: string;
  emailVerified: boolean;
  lastName: string;
  email: Email;
  secret: PasswordSecret;
  password: string;
  tokens: {
    verifyEmail: UserToken | null;
    passwordReset: UserToken | null;
    session: UserToken | null;
  };
  rights: UserRights;
};

type HubConfig = {
  port: number;
  accessKey: HubAccessKey;
  rootUser: UserId | null;
};

type DHTConfig = {
  type: 11 | 22;
  pin: number;
  tmpOffset: number;
  humidityOffset: number;
  precision: number;
};

type HVACStateConfig = {
  times: HVACStateTimes;
  minCycleTime: number;
  minIdleTime: number;
  gpioWire: {
    [key in HVACComponentName]: number;
  };
};

type ThermostatState = {
  target: number;
  mode: ThermostatMode;
  energyMode: EnergyMode;
  delaySpeedCalculation: number;
  routines: ThermostatRoutine[];
  schedule: ThermostatScheduleItem[];
  maxRuntime: number;
  clockSpeed: number;
  targetReachOffset: number;
  auxHeat: {
    [key in EnergyMode]?: {
      belowSpeed: number;
      belowTempFromTarget: number;
    };
  };
  targetPadding: {
    [key in EnergyMode]?: number;
  };
  circulate: {
    [key in EnergyMode]?: { for: number; every: number };
  };
};
