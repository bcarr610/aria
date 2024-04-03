import fs from "node:fs";
import path from "node:path";
import { readJson, writeJson } from "../../utils";

class JSONConfig<C> {
  private path: string;
  private _data: C | {} = {};
  private _defaults: C;

  constructor(configPath: string, defaults: C) {
    this.path = path.resolve(configPath);
    this._defaults = defaults;
  }

  async load(): Promise<C> {
    try {
      this._data = await readJson<C>(this.path);
      return this._data;
    } catch (err) {
      console.error(err);
      throw new Error(`Failed to load and parse configuration for ${this.path}`);
    }
  }

  get data(): C {
    return this._data as C;
  }

  get defaults(): C {
    return this._defaults as C;
  }

  async update(): Promise<C> {
    await writeJson(this.path, this._data);
    return this._data as C;
  }
}

export default JSONConfig;
