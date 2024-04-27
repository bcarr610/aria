import fs from "fs";
import path from "path";

class FileStore<T extends Record<string, any> | Array<any>> {
  private savePath: string;
  data: T;

  constructor(savePath: string, initialData?: T) {
    this.savePath = savePath;

    if (this.storeExists) {
      const content = this.loadSync();
      this.data = content;
    } else {
      if (!initialData) {
        throw new Error("Initial Data Required For New Device");
      }
      this.data = initialData;
      this.saveSync();
    }
  }

  private get storeExists() {
    return fs.existsSync(this.savePath);
  }

  private loadSync(): T {
    try {
      console.log(path.resolve(this.savePath));
      const fileContent = fs.readFileSync(this.savePath, "utf-8");
      const json = JSON.parse(fileContent) as T;
      return json;
    } catch (err) {
      console.error(err);
      throw new Error(`Failed to load file: ${this.savePath}`);
    }
  }

  async load(): Promise<T> {
    try {
      const fileContent = await fs.promises.readFile(this.savePath, "utf-8");
      const json = JSON.parse(fileContent) as T;
      return json;
    } catch (err) {
      console.error(err);
      throw new Error(`Failed to load file: ${this.savePath}`);
    }
  }

  private saveSync() {
    const dir = path.dirname(this.savePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this.savePath, JSON.stringify(this.data));
    return this.data;
  }

  async save() {
    const dir = path.dirname(this.savePath);
    if (!fs.existsSync(dir)) {
      await fs.promises.mkdir(dir, { recursive: true });
    }
    await fs.promises.writeFile(this.savePath, JSON.stringify(this.data));
    return this.data;
  }

  async deleteStore() {
    if (this.storeExists) {
      await fs.promises.unlink(this.savePath);
    }
  }
}

export default FileStore;
