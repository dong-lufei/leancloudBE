import { verify } from "https://deno.land/x/djwt/mod.ts";
import cfg from "../../../config.js";

const authMiddleware = async (ctx, next) => {
  const headers = ctx.request.headers;

  const authorization = headers.get("Authorization");
  try {
    if (!authorization || !authorization.split(" ")[1]) {
      ctx.response.status = 401;
      ctx.response.body = {
        status: 401,
        msg: "Unauthorized",
      };
      return;
    }
    const jwt = authorization.split(" ")[1];
    // console.log(jwt, cfg.Key);

    const s = await verify(jwt, cfg.Key);
    if (s) {
      await next();
      return;
    }

    ctx.response.status = 401;
    ctx.response.body = {
      status: 401,
      msg: "Invalid jwt token",
    };
  } catch (error) {
    ctx.response.status = 500;
    ctx.response.body = {
      status: 500,
      msg: "JWT incorrect or expired!!!",
    };
  }
};

export default authMiddleware;
