

export default (req) => {
  console.log("请求库是", req);

  return {
    config(cfg) {
      return {
        // 增
        add(tableName, reqCfg) {
          const url =
            tableName === "login" || tableName === "batch"
              ? `${cfg}/1.1/${tableName}`
              : `${cfg}/1.1/classes/${tableName}`;

          console.log("路径", url);

          if (req === fetch) {
            // # fetch 方式有格式要求
            reqCfg.body = JSON.stringify(reqCfg["body"]);
            reqCfg.headers = {
              "content-type": "application/json",
            };
          }
          const data = {
            method: "POST",
            ...reqCfg,
          };
          // }

          console.log("POST接口的请求配置", data);
          return req(url, data);
        },

        // 读
        list(tableName) {
          return req(`${cfg}/1.1/classes/${tableName}`, {
            method: "GET",
          });
        },

        // 改
        update(tableName, reqCfg) {
          if (req === fetch) {
            // # fetch 方式有格式要求
            reqCfg.body = JSON.stringify(reqCfg["body"]);
            reqCfg.headers = {
              "content-type": "application/json",
              "X-LC-Session": reqCfg["headers"]?.["X-LC-Session"],
            };
          }

          const data = {
            method: "PUT",
            ...reqCfg,
          };
          console.log("PUT接口的请求配置", data);
          return req(`${cfg}/1.1/classes/${tableName}`, data);
        },

        // 删
        del(tableName, reqCfg) {
          if (tableName.startsWith("user/")) {
            reqCfg.headers = {
              "X-LC-Session": reqCfg["headers"]?.["X-LC-Session"],
            };
          }
          const data = {
            method: "DELETE",
            ...reqCfg,
          };
          console.log("删除的表名", tableName);
          console.log("删除接口的配置", data);
          return req(`${cfg}/1.1/classes/${tableName}`, data);
        },
      };
    },
  };
};
