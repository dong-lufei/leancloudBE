import { sh } from "drake";
import cfg from "../../config.js";

const name = "deno";

export default {
  name: "docker",
  desc: "run in docker",
  deps: [],
  do: async function () {
    await sh(
      [
        "podman run --rm -ti",
        `--name=${name.indexOf(":") !== 0 ? name.split(":").join("") : name}`,
        `-p ${cfg.PORT}:${cfg.PORT}`,
        `-v $(pwd):/root/${
          name.indexOf(":") !== 0 ? name.split(":").join("") : name
        }`,
        `mooxe/${name}`,
        "/bin/bash",
      ].join(" ")
    );
  },
};
