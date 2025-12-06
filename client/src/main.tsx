// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App.tsx";
import "./index.css";
import { Effect } from "effect";
import { BrowserRouter } from "react-router-dom";
import { AppProvider } from "./components/AppProvider.tsx";
import { AuthService } from "./services/AuthService.ts";
import { ApiService } from "./services/ApiService.ts";
import { StorageService } from "./services/StorageService.ts";
import {WebAppLive} from "./layers/App.live.ts";

// 1. 定义一个 Effect，它会解析所有服务，然后渲染 React 应用
const main = Effect.gen(function* () {
    // 从上下文中获取所有服务实例
    const services = yield* Effect.all({
        authService: AuthService,
        apiService: ApiService,
        storageService: StorageService,
    });

    // 渲染应用，并将服务实例注入 AppProvider
    ReactDOM.createRoot(document.getElementById("root")!).render(
        <React.StrictMode>
            <BrowserRouter>
                <AppProvider services={services}>
                    <App />
                </AppProvider>
            </BrowserRouter>
        </React.StrictMode>
    );
});

// 2. 将模拟服务层提供给 main effect
const runnable = Effect.provide(main, WebAppLive);

// 3. 运行这个 Effect，启动应用
Effect.runFork(runnable);