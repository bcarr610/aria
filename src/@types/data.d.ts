type UserId = string;
type DeviceId = string;
type UserSessionToken = string;
type DeviceSessionToken = string;
type HubToken = string;
type HubAccessKey = string;
type Email = `${string}@${string}.${string}`;
type PasswordSecret = `${string}_${string}`;

type AriaDeviceType = "window" | "thermostat" | "control_center";

type Connection = {
  socketId: string;
  deviceId: string;
  connectionTime: number;
};

type UserRights = {
  contentAgeLimit: number | null;
  deviceControl: AriaDeviceType[] | "*";
};

type ComRoom = "managers";

type DeviceConfiguration = {
  comRooms: ComRoom[];
  canRemoveDevices: boolean;
  canConnectToHub: boolean;
  canReadTelemetry: boolean;
  canAuthorizeNewDevice: boolean;
  canUpdateDevices: boolean;
  canDeleteDevices: boolean;
  canReadLogs: boolean;
  canViewDevices: boolean;
};

type DeviceData = {
  id: DeviceId;
  type: AriaDeviceType;
  name: string;
  room: string | null;
  groups: string[];
  favorite: boolean;
  config: DeviceConfiguration;
  registrationState: "pending" | "registered";
  registrationTime: number | null;
  address: string;
  // port: number;
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

type UserData = {
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
