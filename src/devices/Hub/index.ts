import path from "path";
import cookieParser from "cookie-parser";
import session from "express-session";
import express, { NextFunction, Request, Response } from "express";
import { createServer } from "node:http";
import { rateLimit } from "express-rate-limit";
import { timeToMs } from "../../utils";
import deviceConfig from "../../device.config";
import {
  generateSessionSecret,
  generateStaticHubKey,
  generateUserSessionToken,
  hash,
  randomBytes,
  strongHash,
} from "../../utils/auth";
import DataStore from "../../instances/DataStore";
import { toPascal } from "../../utils/string";
import Telemetry from "../../instances/Telemetry";
import * as validation from "../../utils/validation";

const sessionSecret = generateSessionSecret();
const telemetry = new Telemetry();

// TODO certain stores should be encrypted when saved to file
const stores = {
  devices: new DataStore("~/aria.hub.devices.g", [] as RegisteredDevice[]),
  users: new DataStore("~/aria.hub.users.g", [] as User[]),
  config: new DataStore("~/aria.hub.config.g", {
    accessKey: generateStaticHubKey(),
    port: 3001,
    rootUser: null,
  } as HubConfig),
};

const app = express();
const server = createServer(app);

// Functions
const fromNow = (value: Time["value"], unit: Time["unit"]) => {
  const d = new Date();
  d.setTime(d.getTime() + timeToMs({ unit, value }));
  return d.getTime();
};

const generateSessionExpireTime = (expireInDays: number = 7) => {
  const now = new Date();
  now.setDate(now.getDate() + expireInDays);
  return now.getTime();
};

const generateAuthTokenExpireTime = (expireInMinutes: number = 30) => {
  const now = new Date();
  now.setTime(now.getTime() + expireInMinutes * 60 * 1000);
  return now.getTime();
};

const hashPassword = (secret: PasswordSecret, password: string) => {
  const [salt, pepper] = secret.split("_");
  const decorated = [salt, password, pepper].join("");
  return hash(decorated);
};

const sendEmailVerificationToken = async (user: User) => {};

const createNewUser = (
  firstName: string,
  lastName: string,
  email: Email,
  password: string,
  rights: UserRights
) => {
  const secret: PasswordSecret = `${randomBytes(16)}_${randomBytes(16)}`;
  const hashedPassword = hashPassword(secret, password);
  const userId = strongHash();

  const newUser: User = {
    id: userId,
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    emailVerified: false,
    email: email.trim() as Email,
    secret,
    password: hashedPassword,
    rights,
    tokens: {
      verifyEmail: {
        token: strongHash(),
        expires: fromNow(24, "HOURS"),
        created: new Date().getTime(),
      },
      passwordReset: null,
      session: null,
    },
  };

  return newUser;
};

const isValidName = (name: string) =>
  typeof name === "string" &&
  validation.hasMinChars(name, 2) &&
  validation.hasNoMoreThanChars(name, 50) &&
  validation.isOnlyAlphaNumeric(name);
const isValidEmail = (email: string) =>
  typeof email === "string" && !!email.match(validation.emailRgxBasic);

const validateUserData = (
  firstName: string,
  lastName: string,
  email: Email,
  password: string
): { status: number; message: string } => {
  // Is firstName and lastName valid
  if (!String(firstName) || !String(lastName)) {
    return { status: 400, message: "Invalid request" };
  }

  // Is email valid
  if (!String(email) || !validation.isValidBasicEmail(email)) {
    return { status: 400, message: "Invalid email" };
  }

  // Is Password Provided
  if (!password) {
    return { status: 400, message: "Missing password" };
  }

  // Is password valid?
  if (!validation.hasMinChars(password, 8)) {
    return { status: 400, message: "Password must be at least 8 characters" };
  }

  if (!validation.hasMinLetters(password, 2)) {
    return { status: 400, message: "Password must contain at least 2 letters" };
  }

  if (!validation.hasMinUpperCase(password, 1)) {
    return { status: 400, message: "Password must contain at least 1 uppercase letter" };
  }

  if (!validation.hasMinLowerCase(password, 1)) {
    return { status: 400, message: "Password must contain at least 1 lowercase letter" };
  }

  if (!validation.hasNoMoreThanChars(password, 32)) {
    return { status: 400, message: "Password cannot be more than 32 characters long" };
  }

  if (!validation.containsNumsAtLeast(password, 1)) {
    return { status: 400, message: "Password must contain at least 1 number" };
  }

  if (!validation.containsSymbolsAtLeast(password, 1)) {
    return { status: 400, message: "Password must contain at least 1 symbol" };
  }

  if (validation.containsUnsafeSymbols(password)) {
    return { status: 400, message: "Password cannot contain unsafe symbols" };
  }

  // Does user exist?
  if (stores.users.data.find((f) => f.email === email)) {
    return { status: 400, message: "User with email exists" };
  }

  if (
    stores.users.data.find(
      (f) =>
        f.firstName.toLowerCase() === firstName.trim().toLowerCase() &&
        f.lastName.toLowerCase() === lastName.trim().toLowerCase()
    )
  ) {
    return { status: 400, message: "User with similar name found" };
  }

  return { status: 200, message: "Success" };
};

// Middleware Handlers
const validateSession = (req: Request, res: Response, next: NextFunction) => {
  const hubTokenHeader = req.headers["X-Hub-Token"];
  const deviceIdHeader = req.headers["X-Device-ID"];
  const userTokenHeader = req.headers["X-User-Token"];

  const hubToken = Array.isArray(hubTokenHeader) ? hubTokenHeader[0] : hubTokenHeader;
  const deviceId = Array.isArray(deviceIdHeader) ? deviceIdHeader[0] : deviceIdHeader;
  const userToken = Array.isArray(userTokenHeader) ? userTokenHeader[0] : userTokenHeader;

  if (!hubToken) {
    res.status(403).send("Not Allowed");
    return;
  }

  if (!deviceId) {
    res.status(400).send("Bad Request");
    return;
  }

  const device = stores.devices.data.find((f) => f.id === deviceId);
  if (!device) {
    res.status(404).send("Device Not Found");
    return;
  }

  if (hubToken !== stores.config.data.accessKey) {
    res.status(403).send("Not Allowed");
    return;
  }

  req.session.hubToken = hubToken;
  req.session.deviceId = deviceId;
  req.session.userToken = userToken || null;
  next();
};

const requireUserSession = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.userToken) {
    res.status(400).send("Bad Request");
    return;
  }

  const user = stores.users.data.find(
    (f) => f.tokens.session && f.tokens.session.token === req.session.userToken
  );

  if (!user) {
    res.status(404).send("User Not Found With Provided Token");
    return;
  }

  const sessionToken = user.tokens.session;

  if (!sessionToken) {
    res.status(403).send("Missing Session Token");
    return;
  }

  if (new Date().getTime() > sessionToken.expires) {
    // TODO Logout
    res.status(403).send("Session Expired");
    return;
  }

  next();
};

const requireVerifiedEmail = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.userToken) {
    res.status(400).send("Bad Request");
    return;
  }

  const user = stores.users.data.find(
    (f) => f.tokens.session && f.tokens.session.token === req.session.userToken
  );

  if (!user) {
    res.status(404).send("User Not Found With Provided Token");
    return;
  }

  if (!user.emailVerified) {
    res.status(403).send("Verify Email First");
    return;
  }

  next();
};

const rootOnly = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.userToken) {
    res.status(400).send("Bad Request");
    return;
  }

  const user = stores.users.data.find(
    (f) => f.tokens.session && f.tokens.session.token === req.session.userToken
  );
  if (!user) {
    res.status(404).send("User Not Found With Provided Token");
    return;
  }

  if (!stores.config.data.rootUser) {
    res.status(403).send("Root User Has Not Been Created Yet");
    return;
  }

  const isRoot = user.id === stores.config.data.rootUser;
  if (!isRoot) {
    res.status(403).send("Root User Required");
    return;
  }

  next();
};

// Standard Server Middleware
app.use(
  rateLimit({
    windowMs: timeToMs({ unit: "MINUTES", value: 1 }),
    limit: 100,
    standardHeaders: "draft-7",
    legacyHeaders: false,
  })
);
app.use(cookieParser());
app.use(
  session({
    secret: sessionSecret,
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(validateSession);

// Login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
});

// Logout
app.post("/logout", requireUserSession, requireVerifiedEmail, async (req, res) => {});

// Generate and send a new email verification token
app.put("/email-verification-token", requireUserSession, rootOnly, async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    res.status(400).send("Bad Request");
    return;
  }

  const userIdx = stores.users.data.findIndex((f) => f.id === userId);
  if (userIdx === -1) {
    res.status(404).send("User Not Found");
    return;
  }

  const newToken: UserToken = {
    token: strongHash(),
    expires: fromNow(24, "HOURS"),
    created: new Date().getTime(),
  };

  stores.users.data[userIdx].tokens.verifyEmail = newToken;
  await stores.users.save();
  await sendEmailVerificationToken(stores.users.data[userIdx]);
  res.status(200).send("New Verification Token Generated");
});

// Verify Token
app.get("/email-verification-token/:token", async (req, res) => {
  const { token } = req.params;
  if (!token) {
    res.status(400).send("Bad Request");
    return;
  }

  const foundUserIdx = stores.users.data.findIndex((f) => f.tokens.verifyEmail?.token === token);

  if (foundUserIdx === -1) {
    res.status(404).send("Token Not Found");
    return;
  }

  const user = stores.users.data[foundUserIdx];
  if (user.emailVerified) {
    res.status(204).send("Token Already Verified");
    return;
  }

  stores.users.data[foundUserIdx].emailVerified = true;
  stores.users.data[foundUserIdx].tokens.verifyEmail = null;
  await stores.users.save();

  res.status(200).send("Success");
  return;
});

// Add User
app.put("/user", requireUserSession, requireVerifiedEmail, rootOnly, async (req, res) => {
  const {
    user: { firstName, lastName, email, password, rights },
  }: {
    user: {
      firstName: User["firstName"];
      lastName: User["lastName"];
      email: User["email"];
      password: User["password"];
      rights: User["rights"];
    };
  } = req.body;

  const validation = validateUserData(firstName, lastName, email, password);

  if (validation.status !== 200) {
    res.status(validation.status).send(validation.message);
    return;
  }

  const newUser = createNewUser(firstName, lastName, email, password, rights);
  stores.users.data.push(newUser);
  await stores.users.save();
  await sendEmailVerificationToken(newUser);
  res.status(200).send("User Created");
});

// Get User
app.get("/user", requireUserSession, requireVerifiedEmail, (req, res) => {
  const user = stores.users.data.find(
    (f) => f.tokens.session && f.tokens.session.token === req.session.userToken
  );

  if (!user) {
    res.status(400).send("Not Found");
    return;
  }

  res.status(200).send(user);
});

// Update Current User
app.post("/user", requireUserSession, requireVerifiedEmail, async (req, res) => {
  const {
    user: { firstName, lastName, email },
  }: {
    user: {
      firstName?: User["firstName"];
      lastName?: User["lastName"];
      email?: User["email"];
    };
  } = req.body;

  const userIdx = stores.users.data.findIndex(
    (f) => f.tokens.session && f.tokens.session.token === req.session.userToken
  );

  if (userIdx === -1) {
    res.status(404).send("Session Not Found");
    return;
  }

  if (firstName && !isValidName(firstName)) {
    res.status(400).send("Invalid First Name");
    return;
  }

  if (lastName && !isValidName(lastName)) {
    res.status(400).send("Invalid Last Name");
    return;
  }

  if (email && !isValidEmail(email)) {
    res.status(400).send("Invalid Email");
    return;
  }

  let updatedFirstName = false;
  let updatedLastName = false;
  let updatedEmail = false;

  if (firstName && firstName !== stores.users.data[userIdx].firstName) {
    updatedFirstName = true;
    stores.users.data[userIdx].firstName = firstName.trim();
  }
  if (lastName && lastName !== stores.users.data[userIdx].lastName) {
    updatedLastName = true;
    stores.users.data[userIdx].lastName = lastName.trim();
  }
  if (email && email !== stores.users.data[userIdx].email) {
    updatedEmail = true;
    stores.users.data[userIdx].email = email.trim() as Email;
    stores.users.data[userIdx].emailVerified = false;
    stores.users.data[userIdx].tokens.verifyEmail = {
      token: strongHash(),
      expires: fromNow(24, "HOURS"),
      created: new Date().getTime(),
    };
    stores.users.data[userIdx].tokens.session = null;
    req.session.userToken = null;
  }

  if (updatedFirstName || updatedLastName || updatedEmail) {
    await stores.users.save();
    if (updatedEmail) {
      await sendEmailVerificationToken(stores.users.data[userIdx]);
      res.status(200).send("Success, New Email Token Generated");
      return;
    }
  }

  res.status(200).send(stores.users.data[userIdx]);
});

// Update Specific User
app.post("/user/:userId", requireUserSession, rootOnly, async (req, res) => {
  const {
    user: { firstName, lastName, email, rights },
  }: {
    user: {
      firstName: User["firstName"];
      lastName: User["lastName"];
      email: User["email"];
      rights: User["rights"];
    };
  } = req.body;

  // TODO Pick Up Here
});

// Delete User
app.delete("/user", () => {});

// Update Device
app.post("/device", () => {});

// Delete Device
app.delete("/device", () => {});

// Device Connection Middleware
app.use(async (req, res, next) => {
  // If device registered, proceed
  if (req.session.device?.registrationState === "registered") {
    next();
  }

  // Otherwise, accept headers to add or authorize device
  else {
    // The access key can be retrieved via hub management endpoint
    const accessKeyHeader = req.headers["X-Access-Key"];
    const deviceIdHeader = req.headers["X-Device-ID"];
    const deviceTypeHeader = req.headers["X-Device-Type"];
    const devicePortHeader = req.headers["X-Device-Port"];

    const deviceId = Array.isArray(deviceIdHeader) ? deviceIdHeader[0] : deviceIdHeader;
    const accessKey = Array.isArray(accessKeyHeader) ? accessKeyHeader[0] : accessKeyHeader;

    // If missing device id or access key
    if (!deviceId || !accessKey) {
      res.status(400).send("Invalid Request");
      return;
    }

    // If invalid access key
    if (accessKey !== stores.config.data.accessKey) {
      res.status(403).send("Invalid Access Key");
      return;
    }

    const device = stores.devices.data.find((f) => f.id === deviceId);

    // Is the device already in the hub system?
    if (!device) {
      const deviceType = (
        Array.isArray(deviceTypeHeader) ? deviceTypeHeader[0] : deviceTypeHeader
      ) as AriaDeviceType;
      const devicePort = Array.isArray(devicePortHeader) ? devicePortHeader[0] : devicePortHeader;

      const portNum = Number(devicePort);

      // Is this a valid device type and is the port valid?
      if (!deviceType || !deviceConfig?.[deviceType] || !devicePort || isNaN(portNum)) {
        res.status(400).send("Invalid Request");
        return;
      }

      // Can the device connect to the hub?
      if (!deviceConfig[deviceType].canConnectToHub) {
        res.status(403).send("Not Allowed");
        return;
      }

      // Add device to hub with pending registration
      stores.devices.data.push({
        id: deviceId,
        type: deviceType,
        name: `Aria-${toPascal(deviceType)}-${new Date().getTime()}`,
        room: null,
        groups: [],
        favorite: false,
        online: false,
        config: deviceConfig[deviceType],
        registrationState: "pending",
        registrationTime: null,
        lastConnectedState: 0,
        lastConnectedStateTime: new Date().getTime(),
        ip: req.ip,
        port: portNum,
      });

      // Save state and send a pending status to device
      await stores.devices.save();
      res.status(202).send("Pending device confirmation from hub");
      return;
    }

    // If device not registered, send pending status
    if (device.registrationState !== "registered") {
      res.status(202).send("Pending device confirmation from hub");
      return;
    }

    // If registered, set the device session and continue
    req.session.device = device;
    next();
  }
});

// Device Endpoints
// Register Device
app.post("/device/register", async (req, res) => {
  const { device: requestingDevice } = req.session;
  const { deviceId, deviceName } = req.body;

  if (!deviceId) {
    res.status(400).send("Invalid request data");
    return;
  }

  // Has requesting device been registered?
  if (requestingDevice?.registrationState !== "registered") {
    res.status(403).send("Device controller must be registered before it can register new devices");
    return;
  }

  // Can requesting device authorize a new device?
  if (requestingDevice?.config.canAuthorizeNewDevice) {
    const targetDeviceIdx = stores.devices.data.findIndex((f) => f.id === deviceId);

    // Does target device exist?
    if (targetDeviceIdx === -1) {
      res.status(404).send("Device not found");
      return;
    }

    const targetDevice = stores.devices.data[targetDeviceIdx];

    // Has target device been registered already?
    if (targetDevice.registrationState !== "registered") {
      res
        .status(403)
        .send("Device controller must be registered before it can register new devices");
      return;
    }

    // Register the device
    stores.devices.data[targetDeviceIdx].registrationState = "registered";
    stores.devices.data[targetDeviceIdx].registrationTime = new Date().getTime();
    if (deviceName) {
      stores.devices.data[targetDeviceIdx].name = deviceName;
    }
    await stores.devices.save();
    res.status(200).send("Device registered");
    return;
  } else {
    res.status(403).send("This device is not allowed to make changes");
    return;
  }
});

// Get Hub Telemetry Info
app.get("/telemetry/info", deviceAccessRequired("canReadTelemetry"), (req, res) => {
  const info = telemetry.systemInfo;
  res.status(200).send(info);
});

// Get Hub Telemetry Stats
app.get("/telemetry/stats", deviceAccessRequired("canReadTelemetry"), async (req, res) => {
  const stats = await telemetry.stats();
  res.status(200).send(stats);
});

// Get Hub Logs
app.get("/logs", deviceAccessRequired("canReadLogs"), (req, res) => {
  res.status(200).send("Not Implemented Yet");
});

// Ping
app.get("/ping", (req, res) => {
  res.status(200).send("Success");
});

server.listen(stores.config.data.port);
