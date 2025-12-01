// src/layers/AuthService.live.ts
import { Layer, Effect, Option } from "effect";
import { AuthService, type AuthData, AuthError } from "../services/AuthService";
import { StorageService } from "../services/StorageService";

const apiUrl = import.meta.env.VITE_MUTATION_API_URL;

export const AuthServiceLive = Layer.effect(
    AuthService,
    Effect.gen(function* () {
        const storage = yield* StorageService;
        return {
            login: ({ username, password }) =>
                Effect.tryPromise({
                    try: async () => {
                        const response = await fetch(`${apiUrl}/rpc/login`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ username, password }),
                        });
                        if (!response.ok) {
                            throw new Error("Invalid credentials");
                        }
                        return (await response.json()) as AuthData;
                    },
                    catch: (e) => new AuthError({ message: (e as Error).message }),
                }),
            logout: () => storage.remove("auth"),
            getAuthState: () =>
                storage.get("auth").pipe(
                    Effect.flatMap(Option.match({
                        onNone: () => Effect.succeed(Option.none()),
                        onSome: (json) => Effect.try({
                            try: () => Option.some(JSON.parse(json) as AuthData),
                            catch: () => Option.none() // 如果解析失败，视为未登录
                        })
                    })),
                    Effect.orElseSucceed(() => Option.none())
                ),
        };
    })
);