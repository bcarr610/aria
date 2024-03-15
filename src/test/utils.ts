const ce = console.error;
const ci = console.info;
const cl = console.log;
const cw = console.warn;

export const disableLogs = () => {
  console.error = () => {};
  console.info = () => {};
  console.log = () => {};
  console.warn = () => {};
};

export const enableLogs = () => {
  console.error = ce;
  console.info = ci;
  console.log = cl;
  console.warn = cw;
};
