[toc]

# 使用步骤：

## Server

1. 创建一个配置文件,比如 config.js

   > 配置文件格式参考 ==config.sample.js== 文件

2. 新建一个启动文件,比如 index.js，引入线上资源并使用它的函数：

```
// 引入线上资源
import AutoApi from "https://cdn.deno.land/leancloudbe/versions/v0.2.1/raw/src/Server/index.js";

// 引入自己创建的配置文件
import tbCfg from "./config.js";

// 传配置启用封装的函数接口
AutoApi.config({
  connect: {
    type: "leancloud",
    appId: "",
    appKey: "",
    baseUrl: "",
  },
  table: tbCfg,
  host: "http://localhost",
  port: 9000,
}).run();
```

3. 运行启动文件

```
比如：
deno run -A index.js
```

## Client

调用接口函数

```
import Client from "https://cdn.deno.land/leancloudbe/versions/v0.2.1/raw/src/Client/index.js";

// import axios from "axios";

// # 增 非用户表的新增
const res1 = await Client(fetch)
  .config("http://localhost:9000")
  .add("garden", {
    body: { city: "city2", area: "area2" },
  });
console.log(res1);
console.log("输出", await res1.json());

// # 读全部
const res2 = await Client(fetch).config("http://localhost:9000").list("garden");
console.log(12, await res2.json());

// # 读单个
const res3 = await Client(fetch)
  .config("http://localhost:9000")
  .list("user/61c41baf7e08401d9efbf24a");
console.log(12, await res3.json());

// # 改 用户表
const res4 = await Client(fetch)
  .config("http://localhost:9000")
  .update("user/61c41baf7e08401d9efbf24a", {
    headers: {
      "X-LC-Session": "tf4ceqtten6v4n69a6f2spoyp",
    },
    body: { a: 124 },
  });
console.log(res4);
console.log("输出", await res4.json());


// # 删用户
const res5 = await Client(fetch)
  .config("http://localhost:9000")
  .del("user/61c41baf7e08401d9efbf24a", {
    headers: {
      "X-LC-Session": "tf4ceqtten6v4n69a6f2spoyp9",
    },
  });
console.log(res5);
console.log("输出", await res5.json());

// # 批量接口
const res6 = await Client(fetch)
  .config("http://localhost:9000")
  .add("batch", {
    body: {
      requests: [
        {
          method: "POST",
          path: "/1.1/classes/user",
          body: {
            mobilePhoneNumber: "18012349870",
            phone: "1801234220",
            authData: {
              weixin2: {
                openid: "oeisI5kKaToGCrnku-HHYhwCSw8794220",
                access_token: "ZI42mPpS9SM78jRDYxfkWQ==",
              },
            },
            password: "123",
          },
        },
        {
          method: "POST",
          path: "/1.1/classes/user",
          body: {
            username: "17712987693",
            password: "12",
            phone: "17712345682",
          },
        },
      ],
    },
  });
console.log(res6);
console.log("输出", await res6.json());
```
