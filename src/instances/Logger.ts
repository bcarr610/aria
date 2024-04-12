class Logger {
  constructor() {}

  info(message: string) {
    console.info(message);
  }

  warn(message: string) {
    console.warn(message);
  }

  error(message: string, err?: any) {
    console.error(message);
    if (err) console.error(err);
  }
}

export default Logger;
