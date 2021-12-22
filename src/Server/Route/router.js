import { Router } from "https://deno.land/x/oak/mod.ts";

import { toRouter } from "../Service/index.js";
// import "../Service/index.js";
import authMiddleware from "./authMiddleware.js";

const router = new Router();

router.get("/", (ctx) => {
  ctx.response.body = "Successfully visited the homepage!!";
});

/**
 *
 * @param {Array} tbCfg 配置有数据库的表名(路由路径)和表默认字段的数组
 * return 各分支路由
 */
export const routerFn = (connect) => (tbCfg) => {
  const MyRouter = (ctx) => toRouter(connect, tbCfg)(ctx);

  for (const it of tbCfg) {
    const tbName = Object.keys(it)[0];

    router
      // 所有普通表
      .get(`/1.1/classes/${tbName}`, MyRouter)
      .post(`/1.1/classes/${tbName}`, MyRouter)
      .get(`/1.1/classes/${tbName}/:id`, MyRouter)
      .put(`/1.1/classes/${tbName}/:id`, MyRouter)
      .delete(`/1.1/classes/${tbName}/:id`, MyRouter);
  }

  // 单独的post接口
  router
    // 登录
    .post("/1.1/login", MyRouter)
    // 批量操作
    .post("/1.1/batch", MyRouter);
  // .post("/1.1/batch", authMiddleware, MyRouter);
};

export default router;
