// src/layers/ApiService.live.ts
import { Layer, Effect, Option } from "effect";
import { ApiService, type ApiResponse, ApiError } from "../services/ApiService";
import { StorageService } from "../services/StorageService";
import type {AuthData} from "../services/AuthService";

const apiUrl = import.meta.env.VITE_MUTATION_API_URL;

export const ApiServiceLive = Layer.effect(
    ApiService,
    Effect.gen(function* () {
        const storage = yield* StorageService;

        // 辅助 Effect，用于从存储中获取 token
        const getAuthToken = storage.get("auth").pipe(
            Effect.flatMap(Option.match({
                onNone: () => Effect.fail(new ApiError({ message: "Not authenticated" })),
                onSome: (json) => Effect.succeed((JSON.parse(json) as AuthData).token),
            }))
        );

        return {
            createRequest: (input) =>
                Effect.gen(function* () {
                    const token = yield* getAuthToken;
                    return yield* Effect.tryPromise({
                        try: async () => {
                            const response = await fetch(`${apiUrl}/rpc/create_request`, {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                    "Authorization": `Bearer ${token}`,
                                },
                                body: JSON.stringify({ input }),
                            });
                            if (!response.ok) {
                                const errorBody = await response.json();
                                throw new Error(errorBody.error || "Failed to create request");
                            }
                            return (await response.json()) as ApiResponse;
                        },
                        catch: (e) => new ApiError({ message: (e as Error).message }),
                    });
                }),
        };
    })
);