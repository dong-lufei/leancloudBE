import { sh } from "drake";
import __ from "../utils/dirname.js";
import DockerFile from "https://raw.githubusercontent.com/Mooxe000/mooxe-docker/master/src/Docker_file.js";

const { __dirname } = __(import.meta.url);

const dockerfile = DockerFile().from`docker.io/mooxe/deno`
  .run`mkdir -p /root/deno`.add`./build/yezhuhui-be /root/deno`();

export default {
  name: "build",
  desc: "build docker images",
  deps: [],
  do: async function (...args) {
    await sh(`echo '${dockerfile}' > ${__dirname}../../Dockerfile`);
    await sh(
      `rm -rf ${__dirname}../../build && mkdir -p ${__dirname}../../build`
    );

    // await sh(
    //   `cd ${__dirname}../../ && deno bundle ./src/index.js  ./build/index.js`
    // );
    await sh(
      `cd ${__dirname}../../ && deno compile -o ./build/yezhuhui-be --allow-net ./index.js`
    );
    // await sh(
    //   `cd ${__dirname}../../ && buildah bud --no-cache -t ccr.ccs.tencentyun.com/zyrt/yezhuhui-be`
    // );
    // await sh(`podman push ccr.ccs.tencentyun.com/zyrt/yezhuhui-be`);
  },
};
