// src/hooks/useRunEffect.ts
import { Runtime, Effect } from "effect";
import  { createContext, useContext, useState, useCallback } from "react";

// 1. 创建一个用于存放 Effect Runtime 的 React Context
export const RuntimeContext = createContext<Runtime.Runtime<any> | null>(null);

// 2. 创建一个 Hook，用于执行 Effect
export const useRunEffect = <E, A>() => {
    const runtime = useContext(RuntimeContext);
    if (!runtime) {
        throw new Error("Cannot use `useRunEffect` outside of a `RuntimeProvider`");
    }

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<E | null>(null);
    const [data, setData] = useState<A | null>(null);

    const run = useCallback((effect: Effect.Effect<A, E, any>) => {
        setIsLoading(true);
        setError(null);
        setData(null);

        const program = effect.pipe(
            Effect.tap((result) => Effect.sync(() => setData(result))),
            Effect.tapError((err) => Effect.sync(() => setError(err))),
            Effect.ensuring(Effect.sync(() => setIsLoading(false)))
        );

        // 使用从 Context 获取的 runtime 来执行 Effect
        Runtime.runFork(runtime)(program);
    }, [runtime]);

    return { run, isLoading, error, data };
};