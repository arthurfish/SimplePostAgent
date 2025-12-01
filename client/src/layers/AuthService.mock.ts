import { Layer, Effect, Option } from "effect";
import { AuthService } from "../services/AuthService";
import { StorageService } from "../services/StorageService";

export const AuthServiceMock = Layer.effect(
    AuthService,
    Effect.gen(function* () {
        const storage = yield* StorageService;
        return {
            login: () =>
                Effect.succeed({ token: "mock-token", userId: "mock-user-id" }),
            logout: () => storage.remove("auth"),
            getAuthState: () => storage.get("auth").pipe(Effect.map(Option.map((str) => JSON.parse(str)))),
        };
    })
);