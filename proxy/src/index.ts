// src/index.ts
import express from "express";
import { createProxyMiddleware, fixRequestBody } from "http-proxy-middleware";
import cors from "cors";
import { Effect, Config, Console, Layer, Cause, Exit } from "effect";
import { NodeRuntime } from "@effect/platform-node";
import jwt from "jsonwebtoken";

// ----------------------------------------------------------------------
// 1. 配置层 (Configuration)
// ----------------------------------------------------------------------

const ServerConfig = {
    port: Config.number("PROXY_PORT").pipe(Config.withDefault(3001)),
    electricUrl: Config.string("ELECTRIC_URL").pipe(Config.withDefault("http://localhost:3000")),
    jwtSecret: Config.string("JWT_SECRET").pipe(Config.withDefault("my-super-secret-key")), // 开发环境默认值
};

// ----------------------------------------------------------------------
// 2. 核心代理逻辑 (Proxy Logic)
// ----------------------------------------------------------------------

const startServer = Effect.gen(function* () {
    // 获取配置
    const port = yield* ServerConfig.port;
    const electricUrl = yield* ServerConfig.electricUrl;
    const jwtSecret = yield* ServerConfig.jwtSecret;

    const app = express();

    app.use(cors({
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        // ★★★ 关键：暴露 Electric SQL 需要的自定义响应头 ★★★
        exposedHeaders: ['electric-offset', 'electric-handle', 'electric-schema'],
        credentials: true // 如果 Electric 后端使用了 cookie 或 auth headers
    }));
    app.use(express.json());

    // 健康检查
    app.get("/health", (_, res) => res.json({ status: "ok", role: "proxy" }));

    // --- Electric Shape 代理 ---
    // 这是最关键的部分：拦截 Shape 请求并注入 User ID 过滤
    app.use(
        "/v1/shape",
        (req, res, next) => {
            // 1. 简单的 JWT 验证逻辑 (Phase 2 验证里程碑)
            // 在生产环境中，这里应该解析 Authorization Header
            // 为了测试方便，我们先尝试从 Header 获取，如果没有则使用一个测试 ID
            let userId: string | null = null;

            try {
                const authHeader = req.headers.authorization;
                if (authHeader && authHeader.startsWith("Bearer ")) {
                    const token = authHeader.split(" ")[1];
                    const decoded = jwt.verify(token, jwtSecret) as any;
                    userId = decoded.user_id || decoded.sub;
                }
            } catch (e) {
                console.error("Token verification failed:", e);
            }

            // 如果没有 Token，为了开发方便，我们允许 query 参数传递 (仅限开发!)
            // 或者在生产环境直接拒绝：
            // if (!userId) return res.status(401).json({ error: "Unauthorized" });

            // 模拟：如果没有 Auth，为了跑通流程，我们暂时硬编码一个测试 UUID (与数据库测试一致)
            if (!userId) {
                console.warn("⚠️ No Valid JWT found!");
                return res.status(401).json({ error: "Unauthorized" });
            }

            console.log(`[Proxy] Proxying shape request for user: ${userId}`);

            // 2. 将 userId 注入到请求对象中，供 proxy middleware 使用
            (req as any).user_id = userId;
            next();
        },
        createProxyMiddleware({
            target: electricUrl,
            changeOrigin: true,
            pathRewrite: {
                // Express 路由已经匹配了 /v1/shape，这里保持原样转发到 Electric
                "^/v1/shape": "/v1/shape",
            },
            on: {
                proxyReq: (proxyReq, req: any, res) => {
                    // ★★★ 核心魔法：修改 Query Params ★★★
                    // Electric 使用 `where` 参数来过滤数据

                    // 获取当前 URL 对象
                    // 注意：proxyReq.path 包含了 query string
                    const originalUrl = new URL("http://dummy" + proxyReq.path);
                    const searchParams = originalUrl.searchParams;

                    // 强制注入 where 子句
                    // 语法: "column_name" = 'value'
                    const existingWhere = searchParams.get("where");
                    const userFilter = `"user_id" = '${req.user_id}'`;

                    if (existingWhere) {
                        // 如果原本就有 where，我们需要用 AND 组合 (虽然通常客户端不应该发 where)
                        searchParams.set("where", `(${existingWhere}) AND (${userFilter})`);
                    } else {
                        searchParams.set("where", userFilter);
                    }

                    // 重写路径
                    proxyReq.path = '/v1/shape' + "?" + searchParams.toString();

                    console.log(`[Proxy] Upstream URL: ${proxyReq.path}`);
                }
            }
        })
    );

    // 启动监听
    yield* Effect.sync(() => {
        app.listen(port, () => {
            console.log(`✨ SimplePostAgent Proxy running on port ${port}`);
            console.log(`👉 Target Electric URL: ${electricUrl}`);
        });
    });

    // 保持进程运行 (在 Effect 中，如果这里结束，runMain 可能会退出)
    yield* Effect.never;
});

// ----------------------------------------------------------------------
// 3. 运行主程序 (Main Runner)
// ----------------------------------------------------------------------

// 处理可能的错误并运行
const program = startServer.pipe(
    Effect.catchAll((error) => Effect.logError("Server failed to start", error))
);

NodeRuntime.runMain(program);