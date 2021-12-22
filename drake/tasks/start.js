import { sh } from "drake";
import __ from "../utils/dirname.js";

const { __dirname } = __(import.meta.url);

export default {
  name: "start",
  desc: "start service",
  deps: [],
  do: async function (...args) {
    await sh(`deno run -A  --unstable --watch ${__dirname}/../../index.js`);
  },
};
