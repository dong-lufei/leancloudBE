import {
  buildJWT,
  getCfgData,
  checkField,
  getFullUrl,
  responseData,
  handleUser,
} from "./utils.js";

// 路由处理函数 处理请求
export const toRouter = (conn, tbCfg) => async (ctx) => {
  // console.log("conn", conn);
  // 拿到请求方法
  const { method } = ctx.request; // console.log("'请求方法':", method);

  // 拿到请求路径、查询参数
  const { pathname, search } = ctx.request.url; // console.log("'请求路径':", pathname);

  let fetchUrl = getFullUrl(conn, pathname, search); // 得到初始完整的请求url

  // 得到初始的请求方法、请求头
  const opt = {
    method,
    headers: {
      "X-LC-Id": conn.AppID,
      "X-LC-Key": conn.AppKey,
    },
  };

  let sessionToken = "",
    username = "";
  let errRes = "",
    resBat = [];

  // # 处理有请求体的情况
  if (["POST", "PUT"].includes(method)) {
    // 1.新增和修改接口需要携带请求体，否则报错返回
    // 请求体为空对象或空 hasBody竟然为true 不进这句条件块代码=>bug
    if (!ctx.request.hasBody) {
      responseData(ctx, 400, "No data provided");
      return;
    }

    // 设置请求头格式 （只有POST和PUT需要请求体，所以在此限制格式）
    opt.headers["Content-Type"] = "application/json";

    // 拿到请求体数据 （程序走到这里表示有请求体）
    let body = await ctx.request.body().value;
    // # 请求体为空对象就报错
    if (!Object.keys(body).length) {
      responseData(ctx, 400, "请求体不能为空");
      return;
    }
    // console.log("展示请求体数据：", body);

    // # 拿到配置表字段的默认值数据;
    // 2.区别单个新增 和 批量操作的接口
    if (pathname !== "/1.1/batch") {
      // # 检查请求的字段和类型 (非批量里的登录接口 这里不检查) 有不符合的报错
      if (pathname !== "/1.1/login") {
        errRes = checkField(body, pathname, tbCfg);
        if (errRes) {
          console.log("字段错误：", errRes);
          responseData(ctx, errRes.code, errRes.msg);
          return;
        }
      }

      // 根据请求路由 判断此路由是否用户接口
      const isUserFetch = getCfgData(pathname, tbCfg).isUser;
      // 3.区别是否用户表 # 新增或修改普通非内置用户表前 先新增或修改内置用户表
      if (isUserFetch) {
        // 是用户表
        const userAfter = await handleUser(
          conn,
          tbCfg,
          body,
          method,
          pathname,
          search,
          opt,
          ctx,
          sessionToken,
          username,
          fetchUrl
        );
        body = userAfter.body;
        fetchUrl = userAfter.fetchUrl;
        username = userAfter.username;
        sessionToken = userAfter.sessionToken;
        opt.method = userAfter.method;
        errRes = ctx.response.body;
        console.log(96, fetchUrl, "错误返回：", errRes);
      } else {
        // 非用户表的POST
        if (method === "POST") {
          body = { ...getCfgData(pathname, tbCfg).defaults, ...body }; // 混合默认字段数据和请求体数据  请求体数据可覆盖默认值
        }
        // 非用户表的PUT 就是原body
      }
      // console.log("'非批量接口的请求体':", body);
    }
    // # 这里是批量接口
    else if (pathname === "/1.1/batch" && method === "POST") {
      // 遍历批量接口的请求体里的路由
      for (let [index, item] of body.requests.entries()) {
        // 获取配置表的相关数据
        const cfgData = getCfgData(item.path, tbCfg);
        if (!cfgData.isRoute) {
          // 不在数据表配置中的表名路由 报错;
          responseData(ctx, 404, `此path ${item.path} ,不在数据配置表上！！`);
          return;
        }

        // 批量接口的字段检查
        errRes = checkField(item.body, item.path, tbCfg);
        if (errRes) {
          responseData(ctx, errRes.code, errRes.msg);
          return;
        }
        // 用户表单独处理
        if (cfgData.isUser) {
          const ses = item.headers?.["X-LC-Session"];
          const userAfter = await handleUser(
            conn,
            tbCfg,
            item.body,
            item.method,
            item.path,
            search,
            opt,
            ctx,
            ses,
            username,
            fetchUrl
          );

          item.body = userAfter.body;

          username = userAfter.username;
          sessionToken = userAfter.sessionToken;
          errRes = ctx.response.body;

          resBat[index] = {
            username: userAfter.username,
            sessionToken: userAfter.sessionToken,
          };

          opt.method = method;
          console.log(97, fetchUrl, errRes);
        } else if (item.method === "POST") {
          // 批量新增的接口 要加字段默认值数据
          item.body = {
            ...getCfgData(item.path, tbCfg).defaults,
            ...item.body,
          };
        }
      }
    }

    // put接口 和 以上赋值后的数据格式转换
    opt.body = JSON.stringify(body);
  }

  let resBody; //响应后的json格式数据
  try {
    // 获取和删除单个数据接口 资源不存在时的错误处理
    if (ctx.params.id && ["GET", "DELETE"].includes(method)) {
      const n = pathname.lastIndexOf("/");
      const n1 = pathname.slice(0, n);
      const n2 = pathname.slice(n + 1);
      // 拼接查询参数 以备后面请求数据库用
      const newUrl = `${conn.BASE_URL}${n1}?where={"objectId":"${n2}"}&count=1`;

      // 发送请求 访问数据库 看是否有此资源
      const checkData = await fetch(newUrl, {
        method: "GET",
        headers: opt.headers,
      });
      const hasData = await checkData.json();
      //访问leancloud服务器失败报错
      if (!checkData.ok) {
        responseData(ctx, hasData.code, hasData.error);
        return;
      }

      // 此Id数据库不存在 报错
      if (!hasData.count) {
        responseData(ctx, 404, `此资源 ${ctx.params.id} 在数据库上不存在!!`);
        return;
      }

      // # 获取是否用户表路由
      const isUserFetch = getCfgData(pathname, tbCfg).isUser;

      // 1.如果是用户表路由 删除普通用户前先删除内置用户
      if (isUserFetch && method === "DELETE") {
        // 拿到用户请求体的Session（修改删除内置表数据需要它或masterKey）
        const sessionKey = ctx.request.headers.get("X-LC-Session");
        opt.headers["X-LC-Session"] = sessionKey;
        // 用户表的删除不带session就报错
        if (!sessionKey) {
          responseData(
            ctx,
            206,
            "The user cannot be altered by other users or with outdated session!!"
          );
          return;
        }
      }
    }

    if (errRes) {
      console.log("提前出错");
      responseData(ctx, errRes.code, errRes.msg);
    } else {
      console.log("最终url：", fetchUrl, "\n和配置：", opt);
      // 最后 发送请求访问leancloud数据库
      const resDB = await fetch(fetchUrl, opt);
      // const resDB = await fetch(fetOpt.url, fetOpt.cfg);
      console.log("'DB响应':", resDB.ok, "lo", resDB.headers.get("location"));

      resBody = await resDB.json();
      console.log("'响应后的json格式数据':", resBody);

      if (!resDB.ok) {
        console.log("调用leancloud服务器失败：");
        ctx.response.body = {
          code: resBody.code,
          msg: resBody.error || "访问服务器失败！！！",
        };
      } else {
        const bodyData = {
          code: resDB.status,
          msg: resDB.statusText,
          data: resBody,
        };

        const isUserFetch = getCfgData(pathname, tbCfg).isUser;
        // 判断是登录或注册登录一体接口 请求成功时 响应JWT
        if (
          (isUserFetch ||
            pathname === "/1.1/login" ||
            pathname === "/1.1/batch") &&
          method === "POST"
        ) {
          const userName = resBody.username;
          const sToken = resBody.sessionToken;

          // # 非批量接口登录、注册登录响应 sessionToken、username、JWT
          if (pathname !== "/1.1/batch" || pathname === "/1.1/login") {
            // 用户注册或登录接口响应sessionToken 和username;
            if (userName) {
              bodyData.data[`sessionToken`] = sToken;
              bodyData.data[`username`] = userName;
              // 根据用户名响应JWT   拿到用户名，去加密产生JWT
              bodyData.data.jwt = await buildJWT(userName, conn);
            } else {
              bodyData.data[`sessionToken`] = sessionToken;
              bodyData.data[`username`] = username;
              // 根据用户名响应JWT   拿到用户名，去加密产生JWT
              bodyData.data.jwt = await buildJWT(username, conn);
            }
          } else {
            // 批量接口登录、注册登录 响应 sessionToken、username、JWT
            for await (let [index, item] of resBat.entries()) {
              if (!item?.username) {
                bodyData.data[index]["success"] = {
                  ...bodyData.data[index]["success"],
                };
              } else {
                bodyData.data[index]["success"] = {
                  ...bodyData.data[index]["success"],
                  ...item,
                  jwt: await buildJWT(item.username, conn),
                };
              }
            }
          }
        }

        // 响应给客户端
        ctx.response.body = bodyData;
      }
    }
  } catch (error) {
    console.log("'访问服务器报错啦'：---------", error);
    // 响应给客户端
    if (errRes) {
      console.log("最后响应的前错", errRes);
      ctx.response.body = errRes;
    } else {
      ctx.response.body = {
        code: 500,
        msg: Object.keys(error).length || "Failed to access server!!",
      };
    }
  }
};
