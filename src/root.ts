import path from "node:path";

const root = path.join(__dirname, "..");

export default {
  join: (...paths: string[]) => path.join(root, ...paths),
  path: root,
};
