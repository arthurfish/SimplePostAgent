// src/components/auth/AuthProvider.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { Effect, Option } from "effect";
import type {AuthData} from "../../services/AuthService";
import { useAuthService, useStorageService } from "../AppProvider";

interface AuthContextType {
    auth: Option.Option<AuthData>;
    isLoading: boolean;
    login: (c: {u: string, p: string}) => Effect.Effect<void, Error>;
    logout: Effect.Effect<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [auth, setAuth] = useState<Option.Option<AuthData>>(Option.none());
    const [isLoading, setIsLoading] = useState(true);

    const authService = useAuthService();
    const storageService = useStorageService();

    useEffect(() => {
        const checkAuth = authService.getAuthState().pipe(
            Effect.tap(setAuth),
            Effect.ensuring(Effect.sync(() => setIsLoading(false)))
        );
        Effect.runFork(checkAuth);
    }, [authService]);

    const login = ({u, p}: {u: string, p: string}) => Effect.gen(function* () {
        const authData = yield* authService.login({username: u, password: p});
        yield* storageService.set("auth", JSON.stringify(authData));
        setAuth(Option.some(authData));
    }).pipe(Effect.withSpan("login-flow"));

    const logout = Effect.gen(function* () {
        yield* authService.logout();
        setAuth(Option.none());
    }).pipe(Effect.withSpan("logout-flow"));

    const value = { auth, isLoading, login, logout };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within an AuthProvider");
    return context;
};