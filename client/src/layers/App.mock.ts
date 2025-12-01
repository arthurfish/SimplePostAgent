import { Layer } from "effect";
import { AuthServiceMock } from "./AuthService.mock";
import { ElectricServiceMock, ApiServiceMock } from "./ElectricService.mock";
import { StorageServiceMock } from "./StorageService.mock";

// 将所有模拟服务合并为一个完整的应用层
export const MockAppLive = Layer.mergeAll(
    AuthServiceMock,
    ApiServiceMock,
    ElectricServiceMock,
    StorageServiceMock,
).pipe(Layer.provide(StorageServiceMock));