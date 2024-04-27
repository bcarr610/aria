import FileStore from "../shared/FileStore";

class ThermostatStore extends FileStore<ThermostatStoreData> {
  constructor(savePath: string, initialData?: ThermostatStoreData) {
    super(savePath, initialData);
  }

  get dht() {
    return this.data.dht;
  }
  get hvac() {
    return this.data.hvac;
  }
}

export default ThermostatStore;
