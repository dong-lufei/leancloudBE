[toc]

# 创建一个配置文件比如 config.js

# 引入线上资源 然后使用如下：

```
// 引入线上资源
import AutoApi from "xx";
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
