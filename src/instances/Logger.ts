class Logger {
  constructor() {}

  info(message: string) {
    console.info(message);
  }

  warn(message: string) {
    console.warn(message);
  }

  error(message: string, err: Error) {
    console.error(message);
    console.error(err);
  }
}

export default Logger;
