import { Layer, Effect, Ref, Option } from "effect";
import { StorageService } from "../services/StorageService";

export const StorageServiceMock = Layer.effect(
    StorageService,
    Effect.gen(function* () {
        const store = yield* Ref.make(new Map<string, string>());
        return {
            set: (key, value) => Ref.update(store, (map) => map.set(key, value)),
            // 修正: 从 Map 中获取指定 key 的值，而不是返回整个 Map
            get: (key: string) =>
                Ref.get(store).pipe(
                    Effect.map((map) => Option.fromNullable(map.get(key)))
                ),
            remove: (key) => Ref.update(store, (map) => (map.delete(key), map)),
        };
    })
);