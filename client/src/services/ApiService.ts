import { Effect, Context, Data } from "effect";

// --- 模型定义 ---
export class ApiError extends Data.TaggedError("ApiError")<{
    message: string;
}> {}

export interface ApiResponse {
    readonly id: string;
    readonly txid: string;
}

// --- 服务接口定义 ---
export class ApiService extends Context.Tag("ApiService")<
    ApiService,
    {
        readonly createRequest: (
            input: string
        ) => Effect.Effect<ApiResponse, ApiError>;
    }
>() {}