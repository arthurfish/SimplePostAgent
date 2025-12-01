// src/hooks/useLiveQueries.ts
import { useShape } from "@electric-sql/react";
import { useAuth } from "../components/auth/AuthProvider";
import { Option } from "effect";

// 重新定义数据模型，因为 ElectricService 被移除了
export interface Request {
    id: string;
    user_input: string;
    final_report: string | null;
    status: "pending" | "processing" | "aggregating" | "completed" | "failed";
    created_at: string;
    [key: string]: unknown;
}

export interface SubTask {
    id: string;
    request_id: string;
    task_title: string;
    result_content: string | null;
    status: "pending" | "completed" | "failed";
    [key: string]: unknown;
}

const proxyUrl = import.meta.env.VITE_ELECTRIC_PROXY_URL;

// Hook 用于订阅主任务列表
export const useLiveRequests = () => {
    const { auth } = useAuth();
    const token = Option.getOrNull(auth)?.token;

    // useShape 在内部处理了当 token 为 null 时不发起请求的情况
    return useShape<Request>({
        url: `${proxyUrl}/v1/shape`,
        // 通过 headers 传递 token
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        // shape 的定义由 Auth Proxy 在服务器端决定
        // 前端只需要知道订阅的表名即可
        params: {
            table: "requests",
        },
    });
};

// Hook 用于订阅特定 request 的子任务
export const useLiveSubTasks = (requestId: string | undefined) => {
    const { auth } = useAuth();
    const token = Option.getOrNull(auth)?.token;

    // 如果 requestId 不存在，则不发起订阅
    const enabled = !!requestId;

    const shape = useShape<SubTask>({
        url: `${proxyUrl}/v1/shape`,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        params: {
            table: "sub_tasks",
            // where 子句由 Auth Proxy 注入，这里只需按 request_id 过滤
            // 注意：Proxy 会将这里的 where 和 user_id 的 where 用 AND 连接起来
            where: `request_id='${requestId}'`
        },
    }); // 只有 enabled 为 true 时才执行

    // 如果未启用，手动返回加载状态
    if (!enabled) {
        return { data: [], isLoading: true, error: null };
    }

    return shape;
};