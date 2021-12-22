// 接口路径名
export default [
  // 用户
  { user: { isUser: true } },
  // 小区
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
