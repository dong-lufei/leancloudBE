[toc]

# 使用步骤：

1. 创建一个配置文件,比如 config.js

   > 配置文件格式参考 ==config.sample.js== 文件

2. 新建一个启动文件,比如 index.js，引入线上资源并使用它的函数：

```
// 引入线上资源
import AutoApi from "https://deno.land/x/leancloudbe/index.js";
//import AutoApi from "https://cdn.deno.land/leancloudbe/versions/v0.1.0/raw/index.js";

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
deno run -A index.js

// 非登录接口
{baseURL}/1.1/classes/{tableName}
// 登录接口
{baseURL}/1.1/login
```
