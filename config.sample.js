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
  // 用户表
  {
    user: {
      isUser: true,
      fields: {
        username: "string",
        mobilePhoneNumber: "string",
        password: "string",
      },
    },
  },
  // 小区表
  {
    garden: {
      fields: {
        a: "number",
        b: "string",
        c: "boolean",
        d: "null",
        e: "undefined",
        f: "array",
        g: "object",
        h: "date",
      },
      defaults: {
        b: "",
        c: false,
      },
    },
  },
];
