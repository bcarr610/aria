import fs from "fs";
import path from "path";
import { filterDuplicates } from "../utils/array";
import FileStore from "../shared/FileStore";

export class Device extends FileStore<DeviceData> {
  constructor(savePath: string, initialData?: DeviceData) {
    super(savePath, initialData);
  }

  get isRegistered() {
    return this.data.registrationState === "registered";
  }

  get canViewDevices() {
    return this.data.config.canViewDevices;
  }

  get canAuthorizeNewDevice() {
    return this.data.config.canAuthorizeNewDevice;
  }

  get canUpdateDevice() {
    return this.data.config.canUpdateDevices;
  }

  get canRemoveDevice() {
    return this.data.config.canRemoveDevices;
  }

  get canReadLogs() {
    return this.data.config.canReadLogs;
  }

  get canReadTelemetry() {
    return this.data.config.canReadTelemetry;
  }

  get type() {
    return this.data.type;
  }

  get comRooms() {
    return this.data.config.comRooms;
  }

  get name() {
    return this.data.name;
  }

  set name(name: string) {
    this.data.name = name;
  }

  set room(room: string | null) {
    this.data.room = room;
  }

  register() {
    this.data.registrationState = "registered";
    this.data.registrationTime = new Date().getTime();
  }

  addGroups(groups: string[]) {
    const newGroups = filterDuplicates([...this.data.groups, ...groups]);
    this.data.groups = newGroups;
  }

  removeGroups(groups: string[]) {
    this.data.groups = this.data.groups.filter((f) => groups.includes(f));
  }

  set groups(groups: string[]) {
    this.data.groups = groups;
  }

  set favorite(favorite: boolean) {
    this.data.favorite = favorite;
  }

  set type(type: Exclude<AriaDeviceType, "hub">) {
    this.data.type = type;
  }

  set registrationState(registrationState: DeviceData["registrationState"]) {
    this.data.registrationState = registrationState;
    this.data.registrationTime = registrationState === "registered" ? new Date().getTime() : null;
  }

  set address(address: string) {
    this.data.address = address;
  }

  // set port(port: number) {
  //   this.data.port = port;
  // }
}

class DeviceStore {
  private storePath: string;
  devices: Device[] = [];

  constructor(storePath: string) {
    this.storePath = storePath;
    if (!fs.existsSync(this.storePath)) {
      fs.mkdirSync(this.storePath, { recursive: true });
    }

    const files = fs.readdirSync(this.storePath);
    for (let i = 0; i < files.length; i++) {
      const fullPath = path.join(this.storePath, files[i]);
      console.log(`Reading: ${fullPath}`);
      const pathToDevice = path.join(this.storePath, files[i]);
      try {
        const device = new Device(pathToDevice);
        this.devices.push(device);
      } catch (err) {
        console.error(err);
        throw new Error("Corrupt Device Store");
      }
    }
  }

  dump() {
    return this.devices.map((v) => v.data);
  }

  find(id: string | undefined) {
    return this.devices.find((f) => f.data.id === id);
  }

  findByComRoom(comRoom: ComRoom) {
    return this.devices.filter((f) => f.comRooms.includes(comRoom));
  }

  add(data: DeviceData) {
    const device = new Device(path.join(this.storePath, `${data.id}.ag`), data);
    this.devices.push(device);
    return device;
  }

  async remove(id: string) {
    const foundDevice = this.devices.find((f) => f.data.id === id);
    if (foundDevice) {
      await foundDevice.deleteStore();
    }

    this.devices = this.devices.filter((f) => f.data.id !== id);
  }
}

export default DeviceStore;
