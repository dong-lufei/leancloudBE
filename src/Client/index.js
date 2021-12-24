// import "../Server/index.js";

// export const getUsers = () => {
//   return 123;
// };

export default (req) => {
  console.log("req", req);

  return {
    config(cfg) {
      return {
        // 增
        add(tableName, reqCfg) {
          const url =
            tableName === "login" || tableName === "batch"
              ? `${cfg}/1.1/${tableName}`
              : `${cfg}/1.1/classes/${tableName}`;

          // console.log("路径", url);

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

          // console.log("请求配置", data);
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
          console.log(4, data);
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
          console.log(31, tableName);
          return req(`${cfg}/1.1/classes/${tableName}`, data);
        },
      };
    },
  };
};
