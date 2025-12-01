import { Effect, Context, Option } from "effect";
import { Data } from "effect";

// --- 模型定义 ---
// 认证错误
export class AuthError extends Data.TaggedError("AuthError")<{
    message: string;
}> {}

// 认证成功后返回的数据结构
export interface AuthData {
    readonly token: string;
    readonly userId: string;
}

// --- 服务接口定义 ---
export class AuthService extends Context.Tag("AuthService")<
    AuthService,
    {
        readonly login: (credentials: {
            username: string;
            password: string;
        }) => Effect.Effect<AuthData, AuthError>;
        readonly logout: () => Effect.Effect<void>;
        readonly getAuthState: () => Effect.Effect<Option.Option<AuthData>>;
    }
>() {}