import { create, getNumericDate } from "https://deno.land/x/djwt/mod.ts";

// 构建JWT
export async function buildJWT(issuer, leanCfg) {
  // 载荷 存放实际需要传递的数据
  const payload = {
    // 签发人
    iss: issuer,
    // 过期时间
    exp: getNumericDate(10 * 60),
    // exp: getNumericDate(new Date(new Date().getTime() + 60000 * 8 * 60)),
  };
  // 生成JWT
  const jwt = await create({ alg: "HS512", typ: "JWT" }, payload, leanCfg.Key);
  return jwt;
}

// 响应数据
export const responseData = (context, status, message, result = "") => {
  context.response.body = {
    code: status,
    msg: message,
    data: result,
  };
};
// 封装获取数据类型
const getDataType = (data) => {
  const toStr = Object.prototype.toString.call(data);

  //   区分基本数据类型和引用值
  if (typeof data == "object") {
    // console.log("toStr", toStr);
    //   区分部分包装类
    if (toStr === "[object Number]") {
      return "object number";
    } else if (toStr === "[object String]") {
      return "object string";
    } else if (toStr === "[object Boolean]") {
      return "object boolean";
      // ...
    } else {
      return toStr.replace(/^\[object (\S+)\]$/, "$1").toLowerCase();
    }
  } else {
    return typeof data;
  }
};

/**
 *
 * @param {*} pathUrl 请求路径
 * @param {*} tableCfg 表配置数据
 * @returns 返回一个对象{表默认值、是否用户表、请求的路径是否在配置表中}
 */
export const getCfgData = (pathUrl, tableCfg) => {
  let tbName = ""; // 表名字
  const pathArr = pathUrl.split("/");
  // 根据路径斜杠后面的字符串是否有数字 来判断是否动态路由接口
  let allOrSingle = !!pathArr[pathArr.length - 1].match(/\d/);
  tbName = allOrSingle
    ? pathArr[pathArr.length - 2]
    : pathArr[pathArr.length - 1];
  const findData = tableCfg?.find((it) => it[tbName]);
  const tabName = findData?.[tbName];
  // console.log("表名：", tabName);

  return {
    fields: tabName?.fields ?? {}, //根据数据表的名字 拿到表的默认字段数据
    defaults: tabName?.defaults, //根据数据表的名字 拿到表的默认字段数据
    isUser: !!tabName?.isUser, // 是否用户表
    isRoute: !!findData, // 路由是否属于表配置中
  };
};

// 检查字段名是否存在和存在的类型
export const checkField = (fetchBody, path, cfg) => {
  // 得到配置表的字段和类型
  const fields = getCfgData(path, cfg).fields;
  let result = "";
  // 遍历请求体
  for (const key in fetchBody) {
    // 得到请求体的键名和类型
    const fieldType = getDataType(fetchBody[key]);

    // 检查请求字段  不存在于配置表就报错
    if (!fields[key]) {
      // 判断配置表里是否有请求体的这个字段名和对应的类型是否正确
      result = { code: 400, msg: `请求的${key}属性，不在配置表默认字段中` };
      return result;
    }
    // 检查请求的字段类型 是否和配置表相符 不符就返回错误
    if (fieldType !== fields[key]) {
      result = {
        code: 400,
        msg: `请求的${key}属性，类型不符合配置表中的${fields[key]}类型`,
      };
      return result;
    }
  }
  console.log("字段检查，通过就返回空", result);
  return result;
};

// 根据请求路径返回完整的请求url（配置过的url）
export const getFullUrl = (cfgLean, pathUrl, search = "") => {
  return `${cfgLean?.BASE_URL}${pathUrl}${search}${
    search ? "&count=1&fetchWhenSave=true" : "?count=1&fetchWhenSave=true"
  }`;
};

// 普通用户表关联内置用户表的双方操作
export const handleUser = async (
  con,
  TbCfg,
  headers,
  body,
  method,
  pathname,
  search,
  opt,
  ctx,
  sessionToken,
  username,
  fetchUrl
) => {
  // 分解 注册或注册登录一体接口的请求体数据（非内置用户表的字段数据保存到另一个普通用户表）
  let usersBody = {}, // 给内置用户表的请求体 存储内置用户表的内置字段
    users2Body = {}; // 给普通用户表的请求体 存储自定义字段
  // 遍历请求体
  for (const key in body) {
    // 以下是leancloud内置用户表的默认字段
    const defField = [
      "username",
      "password",
      "shortId",
      "emailVerified",
      "mobilePhoneNumber",
      "authData",
      "mobilePhoneVerified",
    ];

    if (defField.includes(key)) {
      // 内置用户表数据
      usersBody[key] = body[key];
    } else {
      // 普通用户表数据
      users2Body[key] = body[key];
    }
  }

  // 4.区别post和put
  if (method === "POST") {
    // 发送post请求 先访问内置用户数据表
    const defUsers = await fetch(getFullUrl(con, "/1.1/users"), {
      method,
      headers: opt.headers,
      body: JSON.stringify(usersBody),
    });

    const dataJson = await defUsers.json();
    // 内置用户表注册成功后 返回id给另一个普通用户表关联
    const usersId = dataJson.objectId; // 先拿到内置用户表的用户id
    sessionToken = dataJson.sessionToken; // 得到内置用户表的sessionToken
    username = dataJson.username; // 得到内置用户表的username
    if (!defUsers.ok) {
      ctx.response.body = {
        code: dataJson.code,
        msg: dataJson.error || "访问用户服务器失败！！",
      };
      return ctx.response.body;
    }

    // 得到当前请求的URL
    fetchUrl = getFullUrl(con, pathname, search);
    const getUsers2Url = `${fetchUrl}&where={"id":{"__type":"Pointer","className":"_User","objectId":"${usersId}"}}`;
    // 向数据库发get请求 获取某id(对应内置用户表objectId)的普通用户表数据是否有数据
    const getUsers2 = await fetch(getUsers2Url, {
      method: "GET",
      headers: opt.headers,
    });

    const oldUsers2 = await getUsers2.json();
    console.log(34, getUsers2.ok, "用户json数据", oldUsers2);
    if (!getUsers2.ok) {
      if (oldUsers2.code === 101) {
      } else {
        ctx.response.body = {
          code: oldUsers2.code,
          msg: oldUsers2.error || "访问普通用户服务器失败！！",
        };
        // return ctx.response.body;
      }
    }
    // 如果已经注册登录过 就更新或修改普通用户表数据
    if (oldUsers2.results?.length) {
      console.log("覆盖旧的注册登录信息");
      // 得到要修改的普通用户的objectId
      const oldData = oldUsers2.results[0];
      const putUsers2Id = oldData.objectId; // 发送请求修改用户接口的路径id
      // 拿到普通用户表的需要被覆盖的字段数据
      const oldDataFilter = JSON.parse(JSON.stringify(oldData));
      delete oldDataFilter.objectId; // 去掉用户表内置字段去请求，否则会报错
      delete oldDataFilter.createdAt;
      delete oldDataFilter.updatedAt;
      delete oldDataFilter.id;

      // 要更新的数据
      body = {
        ...getCfgData(pathname, TbCfg).defaults,
        ...oldDataFilter,
        ...users2Body,
      };
      opt.method = "PUT"; // 把post更改为put
      // 缺点：put接口无法用include关联返回
      fetchUrl = getFullUrl(con, `${pathname}/${putUsers2Id}`, search); // 更改post的url为put
      return {
        body,
        fetchUrl,
        method: opt.method,
        username,
        sessionToken,
        ctx,
      };
    } else {
      console.log("直接注册或第一次注册并登录的接口");
      // 普通用户表用id字段，设置关联内置用户表
      users2Body.id = {
        __type: "Pointer",
        className: "_User",
        objectId: usersId,
      };
      body = { ...getCfgData(pathname, TbCfg).defaults, ...users2Body };
      console.log("注册普通用户表", body);
      return {
        body,
        fetchUrl,
        method: opt.method,
        username,
        sessionToken,
        ctx,
      };
    }
  } else {
    // 发送PUT、DELETE请求前 先查询普通用户数据表 获取id
    const getUsers = await fetch(getFullUrl(con, pathname, search), {
      method: "GET",
      headers: opt.headers,
    });
    const dataJson = await getUsers.json();
    const usersId = dataJson.id?.objectId;
    console.log(66, getUsers.ok, dataJson, usersId);
    // 普通用户表拿内置用户表id 不存在就报错
    if (!usersId) {
      console.log("普通用户id关联失败！！");
      ctx.response.body = {
        code: 404,
        msg: "访问普通用户服务器失败！！",
      };
      return ctx.response.body;
    }

    // 拿到用户请求体的Session（修改内置表需要它或masterKey）
    let sessionKey = "";
    sessionKey = ctx.request.headers.get("X-LC-Session");

    if (sessionKey) {
      opt.headers["X-LC-Session"] = sessionKey;
    } else {
      opt.headers["X-LC-Session"] = sessionToken;
    }

    if (method === "PUT") {
      // 存在 发送put请求 修改内置用户数据表
      const defUsers = await fetch(getFullUrl(con, `/1.1/users/${usersId}`), {
        method,
        headers: opt.headers,
        body: JSON.stringify(usersBody),
      });
      const defUsersJSON = await defUsers.json();

      console.log(668, defUsers.ok, defUsersJSON);
      if (!defUsers.ok) {
        ctx.response.body = {
          code: defUsersJSON.code,
          msg: defUsersJSON.error || "访问用户服务器失败！！",
        };
        return ctx.response.body;
      }

      // 内置用户表修改成功 现在修改普通用户表
      body = users2Body;
    }
    return {
      body,
      fetchUrl,
      method: opt.method,
      username,
      sessionToken,
      ctx,
    };
  }
};
