// api/src/index.ts
import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import postgres from "postgres";
import { Effect, Config, Console } from "effect";
import { NodeRuntime } from "@effect/platform-node";
import { z } from "zod";

// ----------------------------------------------------------------------
// 1. 配置与常量
// ----------------------------------------------------------------------
const AppConfig = {
  port: Config.number("API_PORT").pipe(Config.withDefault(3002)),
  dbUrl: Config.string("DATABASE_URL").pipe(Config.withDefault("postgres://postgres:password@localhost:5432/simple_agent")),
  // 生产环境一定要修改这个 Secret！且必须与 Proxy 中的保持一致
  jwtSecret: Config.string("JWT_SECRET").pipe(Config.withDefault("my-super-secret-key")),
  jwtExpiresIn: "24h"
};

// ----------------------------------------------------------------------
// 2. 数据库层
// ----------------------------------------------------------------------
const makeDb = Effect.gen(function* () {
  const url = yield* AppConfig.dbUrl;
  return postgres(url, {
    transform: { undefined: null },
    max: 10,
  });
});

// ----------------------------------------------------------------------
// 3. 身份认证中间件逻辑 (Helper)
// ----------------------------------------------------------------------
const getAuthUserId = (req: express.Request, secret: string): string | null => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded: any = jwt.verify(token, secret);
    // 兼容 Electric 的标准声明
    return decoded.user_id || decoded.sub || null;
  } catch (e) {
    return null;
  }
};

// ----------------------------------------------------------------------
// 4. 主服务逻辑
// ----------------------------------------------------------------------
const startServer = Effect.gen(function* () {
  const port = yield* AppConfig.port;
  const jwtSecret = yield* AppConfig.jwtSecret;
  const sql = yield* makeDb;

  const app = express();
  app.use(cors());
  app.use(express.json());

  // === Endpoint: Login ===
  // 接收 username/password, 返回 JWT
  app.post("/rpc/login", async (req, res) => {
    const schema = z.object({
      username: z.string(),
      password: z.string()
    });

    const parse = schema.safeParse(req.body);
    if (!parse.success) {
        return res.status(400).json({ error: "Invalid input" });
    }

    const { username, password } = parse.data;

    try {
        // 调用数据库函数 verify_user
        const [result] = await sql`SELECT verify_user(${username}, ${password}) as uid`;
        
        if (!result || !result.uid) {
            // 为了安全，不要提示是用户名错还是密码错
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // 签发 Token
        // ElectricSQL 推荐在 Token 中包含 user_id
        const token = jwt.sign(
            { 
                user_id: result.uid, 
                sub: result.uid,
                username: username
            }, 
            jwtSecret, 
            { expiresIn: AppConfig.jwtExpiresIn }
        );

        console.log(`[Auth] User ${username} logged in successfully.`);
        res.json({ token, user_id: result.uid });

    } catch (error) {
        console.error("[Auth] Login failed:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // === Endpoint: Create Request (Protected) ===
  app.post("/rpc/create_request", async (req, res) => {
    const { input } = req.body;
    
    if (!input) return res.status(400).json({ error: "Missing 'input'" });

    // 1. 强制鉴权
    const userId = getAuthUserId(req, jwtSecret);
    if (!userId) {
        console.warn(`[API] Unauthorized access attempt`);
        return res.status(401).json({ error: "Unauthorized: Invalid or missing token" });
    }

    try {
      // 2. 事务执行
      const result = await sql.begin(async (tx) => {
        // RLS Context
        await tx`SELECT set_config('app.current_user_id', ${userId}, true)`;
        
        // Business Logic
        const [row] = await tx`SELECT api_create_request(${input}) as new_id`;
        
        // Get TXID
        const [meta] = await tx`SELECT pg_current_xact_id()::text as txid`;

        return { txid: meta.txid, id: row.new_id };
      });

      console.log(`[API] Request created by ${userId}. ID: ${result.id}`);
      res.json(result);

    } catch (error: any) {
      console.error("[API] Create Request failed:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  yield* Effect.sync(() => {
    app.listen(port, () => {
      console.log(`✅ Auth & Write API running at http://localhost:${port}`);
    });
  });

  yield* Effect.never;
});

const program = startServer.pipe(
  Effect.catchAll((error) => Effect.logError("Detailed Server Error", error))
);

NodeRuntime.runMain(program);
