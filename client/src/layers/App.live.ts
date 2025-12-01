// src/layers/App.live.ts (修正后)
import { Layer } from "effect";
import { AuthServiceLive } from "./AuthService.live";
import { ApiServiceLive } from "./ApiService.live";
import { StorageServiceLive } from "./StorageService.live";

// 不再包含 ElectricService
export const WebAppLive = Layer.mergeAll(
    AuthServiceLive,
    ApiServiceLive,
    StorageServiceLive,
).pipe(Layer.provide(StorageServiceLive));