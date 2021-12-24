export default [
  {
    // 表名即接口路径名
    tableName: {
      isUser: true, // 需要用户表就填此句，不填默认false
      fields: {
        // 配置表所有字段：
        fieldName: "type", // 键名为表字段名，键值为字段的类型字符串
      },
      defaults: {
        // 配置字段默认值：
        fieldName: "dlf", // 键名为表字段名，键值为字段的值
      },
    },
  },
  // 用户表例子：
  {
    user: {
      isUser: true,
      fields: {
        username: "string",
        mobilePhoneNumber: "string",
        password: "string",
        phone: "string",
        authData: "object",
        a: "number",
        b: "boolean",
        c: "array",
        d: "date",
        e: "null",
        f: "undefined",
      },
    },
  },
  // 小区表例子：
  {
    garden: {
      fields: {
        city: "string",
        area: "string",
        address: "string",
        gardenName: "string",
        img: "string",
        admin: "object",
        OCStatus: "string",
        hasAdmin: "boolean",
      },
      defaults: {
        OCStatus: "",
        hasAdmin: false,
      },
    },
  },
];
