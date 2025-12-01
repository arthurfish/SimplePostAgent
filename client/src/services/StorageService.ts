import { Effect, Context, Option } from "effect";

export class StorageService extends Context.Tag("StorageService")<
    StorageService,
    {
        readonly set: (key: string, value: string) => Effect.Effect<void>;
        readonly get: (key: string) => Effect.Effect<Option.Option<string>>;
        readonly remove: (key: string) => Effect.Effect<void>;
    }
>() {}