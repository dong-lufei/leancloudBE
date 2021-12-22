import { Application } from "https://deno.land/x/oak/mod.ts";
import { oakCors } from "https://deno.land/x/cors/mod.ts";
import { bgRed, white, bold, cyan } from "https://deno.land/std/fmt/colors.ts";

import router, { routerFn } from "./Route/router.js";
import notFound from "./Route/notFoundMiddlewares.js";

export const cfgLean = {
  AppID: "",
  AppKey: "",
  BASE_URL: "",
  HOST: "http://localhost",
  PORT: 80,
  Key: await crypto.subtle.generateKey(
    { name: "HMAC", hash: "SHA-512" },
    true,
    ["sign", "verify"]
  ),
};

export default {
  config: ({ connect, table, host, port }) => {
    cfgLean.AppID = connect.appId;
    cfgLean.AppKey = connect.appKey;
    cfgLean.BASE_URL = connect.baseUrl;
    cfgLean.HOST = host;
    cfgLean.PORT = port;

    if (connect.key) {
      cfgLean.Key = connect.key;
    }

    // 调用用户配置路由
    routerFn(cfgLean)(table);

    async function run() {
      const app = new Application();

      app.use(oakCors()); // 设置跨域

      app.use(router.routes());
      app.use(router.allowedMethods());
      app.use(notFound); // 使用自定义404中间件

      app.addEventListener("listen", ({ secure, hostname, port }) => {
        const protocol = secure ? "https://" : "http://";
        const url = `${protocol}${hostname ?? "localhost"}:${port}`;
        console.log(`${bgRed(white("Listening on:"))} ${bold(cyan(url))}`);
        console.log(`监听: ${cyan(host)}:${port}`);
      });

      await app.listen({ port: port });
    }

    return { run };
  },
};
