// src/components/AppProvider.tsx
import { AuthService } from "../services/AuthService";
import { ApiService } from "../services/ApiService";
import { StorageService } from "../services/StorageService";
import React, { createContext, useContext } from "react";
import { Effect } from "effect";

// 1. 定义服务集合的类型
interface Services {
    readonly authService: Effect.Effect.Success<typeof AuthService>;
    readonly apiService: Effect.Effect.Success<typeof ApiService>;
    readonly storageService: Effect.Effect.Success<typeof StorageService>;
}

// 2. 创建 React Context
const ServicesContext = createContext<Services | null>(null);

// 3. 创建 Provider 组件
export const AppProvider = ({
                                services,
                                children,
                            }: {
    services: Services;
    children: React.ReactNode;
}) => {
    return (
        <ServicesContext.Provider value={services}>
            {children}
        </ServicesContext.Provider>
    );
};

// 4. 创建自定义 Hooks 以便在组件中安全地访问服务
const useServices = () => {
    const context = useContext(ServicesContext);
    if (!context) {
        throw new Error("useServices must be used within an AppProvider");
    }
    return context;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuthService = () => useServices().authService;
// eslint-disable-next-line react-refresh/only-export-components
export const useApiService = () => useServices().apiService;
// eslint-disable-next-line react-refresh/only-export-components
export const useStorageService = () => useServices().storageService;