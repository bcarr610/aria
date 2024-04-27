import fs from "fs";
import path from "path";
import FileStore from "../shared/FileStore";
import { hashPassword, randomBytes, strongHash } from "../utils/auth";
import { fromNow, now } from "../utils/date";

export class User extends FileStore<UserData> {
  constructor(savePath: string, initialData?: UserData) {
    super(savePath, initialData);
  }

  get sessionToken() {
    return this.data.tokens.session;
  }

  get emailToken() {
    return this.data.tokens.verifyEmail;
  }

  get id() {
    return this.data.id;
  }

  get firstName() {
    return this.data.firstName;
  }

  get lastName() {
    return this.data.lastName;
  }

  get emailVerified() {
    return this.data.emailVerified;
  }

  set firstName(value: string) {
    this.data.firstName = value.trim();
  }

  set lastName(value: string) {
    this.data.lastName = value.trim();
  }

  set email(value: Email) {
    this.data.email = value.trim() as Email;
  }

  set emailVerified(value: boolean) {
    this.data.emailVerified = value;
  }

  set sessionToken(value: UserData["tokens"]["session"]) {
    this.data.tokens.session = value;
  }

  async verifyEmail() {
    this.data.emailVerified = true;
    this.data.tokens.verifyEmail = null;
    await this.save();
  }

  generateNewEmailToken() {
    this.data.tokens.verifyEmail = {
      token: strongHash(),
      expires: fromNow(24, "HOURS"),
      created: now(),
    };

    return this.data.tokens.verifyEmail;
  }
}

class UserStore {
  private storePath: string;
  users: User[] = [];

  constructor(storePath: string) {
    this.storePath = storePath;
    if (!fs.existsSync(this.storePath)) {
      fs.mkdirSync(this.storePath, { recursive: true });
    }

    const files = fs.readdirSync(this.storePath);
    for (let i = 0; i < files.length; i++) {
      const pathToUser = path.join(this.storePath, files[i]);
      try {
        const user = new User(pathToUser);
        this.users.push(user);
      } catch (err) {
        console.error(err);
        throw new Error("Corrupt User Store");
      }
    }
  }

  findBySessionToken(token?: string) {
    if (!token) return null;
    return this.users.find((f) => f.sessionToken && f.sessionToken.token === token);
  }

  findByEmailToken(token: string) {
    if (!token) return null;
    return this.users.find((f) => f.emailToken && f.emailToken.token === token);
  }

  findByEmail(email: Email) {
    return this.users.find((f) => f.data.email === email);
  }

  userWithNameExists(firstName: string, lastName: string) {
    return this.users.some(
      (s) => s.firstName === firstName.trim() || s.lastName === lastName.trim()
    );
  }

  find(userId: string) {
    return this.users.find((f) => f.id === userId);
  }

  async add(firstName: string, lastName: string, email: Email, password: string) {
    const id = strongHash();
    const secret: PasswordSecret = `${randomBytes(16)}_${randomBytes(16)}`;
    const hashedPassword = hashPassword(secret, password);
    const user = new User(path.join(this.storePath, `${id}.ag`), {
      id,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      emailVerified: false,
      email: email.trim() as Email,
      secret: `${randomBytes(16)}_${randomBytes(16)}`,
      password: hashedPassword,
      rights: {
        contentAgeLimit: null,
        deviceControl: "*",
      },
      tokens: {
        verifyEmail: {
          token: strongHash(),
          expires: fromNow(24, "HOURS"),
          created: now(),
        },
        passwordReset: null,
        session: null,
      },
    });
    this.users.push(user);
    return user;
  }

  async remove(user: User) {
    await user.deleteStore();
    this.users = this.users.filter((f) => f.id !== user.id);
  }
}

export default UserStore;
