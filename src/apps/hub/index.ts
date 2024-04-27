import "colors";
import { DisconnectReason, Server, Socket } from "socket.io";
import express from "express";
import { createServer } from "node:http";
import deviceConfig from "../../device.config";
import { strongHash } from "../../utils/auth";
import Telemetry from "../../shared/Telemetry";
import DeviceStore from "../../stores/DeviceStore";
import HubStore from "../../stores/HubStore";
import { getHost } from "../../utils";

const telemetry = new Telemetry();

// TODO certain stores should be encrypted when saved to file
let connections: Connection[] = [];
const deviceStore = new DeviceStore("~/ariahub_devices");
const hubStore = new HubStore("~/ariahub.config.ag", {
  port: 3000,
  accessKey: strongHash(),
  rootUser: null,
});

const app = express();
const server = createServer(app);

const io = new Server<HubEvents, ClientEvents, InterWSEvents, HubSocketData>(server);

// Pre-Connect Device Authorization
io.use(async (socket, next) => {
  try {
    const { deviceId, deviceType } = socket.handshake.auth;
    console.log(`Incomming: [${deviceType}] - ${deviceId}`);

    if (!deviceId) {
      console.error("Device ID Not Provided");
      next(new Error("Access Denied"));
      return;
    }

    if (!deviceType) {
      console.error("Device Type Not Provided");
      next(new Error("Access Denied"));
      return;
    }

    // if (!devicePort) {
    //   next(new Error("Access Denied"));
    //   return;
    // }

    const device = deviceStore.find(socket.handshake.auth.deviceId);
    const cfg = deviceConfig?.[deviceType as Exclude<AriaDeviceType, "hub">];

    if (!cfg) {
      next(new Error("Device Not Supported"));
      return;
    }

    if (!device) {
      const newDevice = deviceStore.add({
        id: deviceId,
        type: deviceType,
        name: `Unknown ${deviceType} Device ${new Date().getTime()}`,
        room: null,
        groups: [],
        favorite: false,
        config: cfg,
        registrationState: "pending",
        registrationTime: null,
        address: socket.handshake.address,
        // port: socket.handshake.auth.port,
      });

      await newDevice.save();

      // Emit to all hubs and command centers that a new device is pending review
      io.to("managers").emit("devices", deviceStore.dump());
      next(new Error("Device Authorization Requested"));
      return;
    }

    if (!device.isRegistered) {
      next(new Error("Pending Authorization"));
      return;
    }

    socket.data.device = device;
    next();
  } catch (err) {
    console.error(err);
    next(new Error("Access Denied"));
  }
});

// Device Com-Room Assignment
io.use((socket, next) => {
  const device = socket.data.device;
  if (device?.isRegistered && device?.comRooms?.length) {
    socket.join(device.comRooms);
  }

  next();
});

const handleConnect = (socket: Socket<HubEvents, ClientEvents, InterWSEvents, HubSocketData>) => {
  connections = connections.map((v) => {
    if (v.deviceId === socket.data.device.data.id) {
      return {
        ...v,
        socketId: socket.id,
        connectionTime: new Date().getTime(),
      };
    }

    return v;
  });
};

const handleDisconnect = (
  socket: Socket<HubEvents, ClientEvents, InterWSEvents, HubSocketData>,
  reason: DisconnectReason,
  description?: any
) => {
  connections = connections.filter((f) => f.deviceId !== socket.data.device.data.id);
  console.error(reason);
  if (description) {
    console.warn(description);
  }
};

io.on("connect", (socket) => {
  handleConnect(socket);
  const config = socket.data.device.data.config;

  socket.on("error", (err) => {
    console.error(err);
  });

  socket.on("disconnect", (reason, description) => {
    handleDisconnect(socket, reason, description);
  });

  if (config.canUpdateDevices) {
    socket.on("device:set", async (id, data) => {
      const device = deviceStore.find(id);

      if (!device) {
        socket.emit("fail", new Error("Device ID Not Found"));
        return;
      }

      // Validate Data
      if (data.type && !deviceConfig?.[data?.type]) {
        socket.emit("fail", new Error("Device Type Not Yet Supported"));
        return;
      }

      if (data.name && (data.name.length < 2 || data.name.length > 50)) {
        socket.emit("fail", new Error("Device Name Must Be Between 2 and 50 Characters"));
        return;
      }

      if (data.favorite !== undefined && typeof data.favorite !== "boolean") {
        socket.emit("fail", new Error('Invalid Property Value For "favorite"'));
        return;
      }

      if (data.registrationState && !socket.data.device.canAuthorizeNewDevice) {
        socket.emit("fail", new Error("Access Denied"));
        return;
      }

      if (
        data.registrationState &&
        data.registrationState !== "pending" &&
        data.registrationState !== "registered"
      ) {
        socket.emit("fail", new Error('Invalid Property Value For "registrationState"'));
        return;
      }

      if (data.address && typeof data.address !== "string") {
        socket.emit("fail", new Error('Invalid Property Value For "address"'));
        return;
      }

      // if (data.port && typeof data.port !== "number") {
      //   socket.emit("fail", new Error('Invalid Property Value For "port"'));
      //   return;
      // }

      // Update Data
      let somethingChanged = false;
      if (data.type && data.type !== device.type) {
        somethingChanged = true;
        device.type = data.type;
      }

      if (data.name && data.name !== device.name) {
        somethingChanged = true;
        device.name = data.name;
      }

      if (data.room !== undefined && data.room !== device.room) {
        somethingChanged = true;
        device.room = data.room;
      }

      if (data.groups && data.groups.join("") !== device.groups.join("")) {
        somethingChanged = true;
        device.groups = data.groups;
      }

      if (data.favorite !== undefined && data.favorite !== device.favorite) {
        somethingChanged = true;
        device.favorite = data.favorite;
      }

      if (data.registrationState && data.registrationState !== device.registrationState) {
        somethingChanged = true;
        device.registrationState = data.registrationState;
      }

      if (data.address && data.address !== device.address) {
        somethingChanged = true;
        device.address = data.address;
      }

      // if (data.port && data.port !== device.port) {
      //   somethingChanged = true;
      //   device.port = data.port;
      // }

      if (somethingChanged) {
        await device.save();
        io.to("managers").emit("devices", deviceStore.dump());
      }
    });
  }

  if (config.canAuthorizeNewDevice) {
    socket.on("device:register", async (deviceId) => {
      const device = deviceStore.find(deviceId);
      if (!device) {
        socket.emit("fail", new Error("Device Not Found"));
        return;
      }

      if (!device.isRegistered) {
        device.register();
        await device.save();
      }
    });
  }

  if (config.canDeleteDevices) {
    socket.on("device:remove", async (id) => {
      const device = deviceStore.find(id);
      if (!device) {
        socket.emit("fail", new Error("Device Not Found"));
        return;
      }

      await deviceStore.remove(id);
    });
  }

  socket.on("thermostat:data", (data) => {
    console.log(data);
  });
});

app.use(express.json());

app.post("/register", async (req, res) => {
  const { deviceId } = req.body;
  const ak = req.header("X-Hub-AccessKey");

  if (!deviceId) {
    res.status(400).send("Missing Device ID");
    return;
  }

  if (!ak) {
    res.status(400).send("Missing Hub Access Token");
    return;
  }

  if (ak !== hubStore.accessKey) {
    res.status(403).send("Access Denied");
    return;
  }

  const foundDevice = deviceStore.find(deviceId);
  if (!foundDevice) {
    res.status(404).send("Device Not Found");
    return;
  }

  if (foundDevice.isRegistered) {
    res.status(403).send("Device Already Registered");
    return;
  }

  foundDevice.registrationState = "registered";
  await foundDevice.save();

  res.status(200).send("Device Successfully Registered");
});

server.listen(hubStore.port, () => {
  console.log(`Server listening at ${getHost()}:${hubStore.port}`);
  console.log(`Access Key: ${hubStore.accessKey}`);
});
