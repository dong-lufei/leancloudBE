import { desc, run, task } from "drake";

import getTaskName from "./utils/taskName.js";

import Tasks from "./tasks/index.js";

const taskName = getTaskName();

export default () => {
  Tasks.forEach((t) => {
    desc(t.desc);
    task(
      typeof taskName === "object" && taskName.name === t.name
        ? `${taskName.name}:${taskName.args.join("")}`
        : t.name,
      t.deps,
      async () =>
        typeof taskName === "object" && taskName.name === t.name
          ? await t.do.apply(null, taskName.args)
          : await t.do(),
    );
  });

  run();
};
