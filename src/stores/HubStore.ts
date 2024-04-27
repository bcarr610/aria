import FileStore from "../shared/FileStore";

class HubStore extends FileStore<HubConfig> {
  constructor(savePath: string, initialData?: HubConfig) {
    super(savePath, initialData);
  }

  get accessKey() {
    return this.data.accessKey;
  }

  get port() {
    return this.data.port;
  }

  get rootUser() {
    return this.data.rootUser;
  }
}

export default HubStore;
