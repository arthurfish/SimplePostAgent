// src/layers/StorageService.live.ts
import { Layer, Effect, Option } from "effect";
import { StorageService } from "../services/StorageService";

export const StorageServiceLive = Layer.succeed(
    StorageService,
    StorageService.of({
        set: (key, value) =>
            Effect.try({
                try: () => localStorage.setItem(key, value),
                catch: (unknown) => new Error(`localStorage.setItem failed: ${unknown}`),
            }).pipe(
                Effect.catchAll(() => Effect.succeed(() => console.log("localStorage.setItem failed"))),
            ),
        get: (key) =>
            Effect.try({
                try: () => Option.fromNullable(localStorage.getItem(key)),
                catch: (unknown) => new Error(`localStorage.getItem failed: ${unknown}`),
            }).pipe(
                Effect.catchAll(() => Effect.succeed(Option.fromNullable(""))),
            ),
        remove: (key) =>
            Effect.try({
                try: () => localStorage.removeItem(key),
                catch: (unknown) => new Error(`localStorage.removeItem failed: ${unknown}`),
            }).pipe(
                Effect.catchAll(() => Effect.succeed(Option.fromNullable(""))),
            ),
    })
);