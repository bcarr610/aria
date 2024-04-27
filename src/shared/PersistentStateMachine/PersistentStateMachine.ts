import fs from "node:fs";
import { deepMerge, writeJson, readJsonSync, writeJsonSync, readJson } from "../../utils";

type PersistentStateEvent = "change" | "save" | "load";
type PersistentStateListener = { ev: PersistentStateEvent; listener: PersistentStateHandler };
type PersistentStateHandler = <T>(state: T) => void | Promise<void>;

class PersistentStateMachine<T> {
  private initialState: T;
  private state: T;
  private stateKey: string;
  private saveLocation: string;
  private listeners: PersistentStateListener[] = [];

  constructor(initialState: T, stateKey: string, saveLocation: string) {
    this.initialState = initialState;
    this.stateKey = stateKey;
    this.saveLocation = saveLocation;
    this.state = this.initialState;
    this.loadSync();
  }

  private loadSync(): T {
    if (!fs.existsSync(this.saveLocation)) {
      const newState = { [this.stateKey]: this.initialState };
      writeJsonSync(this.saveLocation, newState);
      this.executeListenersFor("load");
      return newState[this.stateKey];
    } else {
      const content = readJsonSync<T>(this.saveLocation);
      const newContent = { ...content } as { [key: string]: T };
      if (!newContent[this.stateKey]) {
        newContent[this.stateKey] = this.initialState;
      }
      writeJsonSync(this.saveLocation, content);
      this.executeListenersFor("load");
      return newContent[this.stateKey];
    }
  }

  private async loadAsync(): Promise<T> {
    if (!fs.existsSync(this.saveLocation)) {
      const newState = { [this.stateKey]: this.initialState };
      await writeJson(this.saveLocation, newState);
      await this.executeListenersFor("load");
      return newState[this.stateKey];
    } else {
      const content = await readJson<T>(this.saveLocation);
      const newContent = { ...content } as { [key: string]: T };
      if (!newContent[this.stateKey]) {
        newContent[this.stateKey] = this.initialState;
      }
      writeJsonSync(this.saveLocation, newContent);
      await this.executeListenersFor("load");
      return newContent[this.stateKey];
    }
  }

  private saveSync() {
    const currentState = this.loadSync();
    const newState = {
      ...currentState,
      [this.stateKey]: this.state,
    };
    writeJsonSync(this.saveLocation, newState);
    this.executeListenersFor("save");
  }

  private async saveAsync() {
    const currentState = await this.loadAsync();
    const newState = {
      ...currentState,
      [this.stateKey]: this.state,
    };
    await writeJson(this.saveLocation, newState);
    await this.executeListenersFor("load");
  }

  get values(): T {
    return this.state;
  }

  async update(newValues: DeepPartial<T>): Promise<T> {
    this.state = deepMerge(this.state as object, newValues) as T;
    await this.executeListenersFor("change");
    await this.saveAsync();
    return this.state;
  }

  private async executeListenersFor(ev: PersistentStateEvent) {
    const queue = this.listeners.filter((f) => f.ev === ev);
    if (queue.length) {
      for (let i = 0; i < queue.length; i++) {
        await queue[i].listener(this.state);
      }
    }
  }

  on(ev: PersistentStateEvent, listener: PersistentStateHandler) {
    this.listeners.push({
      ev,
      listener: listener.bind(this),
    });
  }

  off(ev: PersistentStateEvent) {
    this.listeners = this.listeners.filter((f) => f.ev !== ev);
  }
}

export default PersistentStateMachine;
