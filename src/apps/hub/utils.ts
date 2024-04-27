import UserStore, { User } from "../../stores/UserStore";
import * as validation from "../../utils/validation";

export const sendEmailVerificationToken = async (user: User) => {};

export const validateUserData = (
  userStore: UserStore,
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
  if (userStore.findByEmail(email)) {
    return { status: 400, message: "User with email exists" };
  }

  if (userStore.userWithNameExists(firstName, lastName)) {
    return { status: 400, message: "User with similar name found" };
  }

  return { status: 200, message: "Success" };
};

export const isValidName = (name: string) =>
  typeof name === "string" &&
  validation.hasMinChars(name, 2) &&
  validation.hasNoMoreThanChars(name, 50) &&
  validation.isOnlyAlphaNumeric(name);

export const isValidEmail = (email: string) =>
  typeof email === "string" && !!email.match(validation.emailRgxBasic);
