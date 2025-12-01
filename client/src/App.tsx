// src/App.tsx
import { AuthProvider } from "./components/auth/AuthProvider";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import {Navigate, Route, Routes} from "react-router-dom";
import {LoginPage} from "./pages/LoginPage.tsx";
import {DashboardPage} from "./pages/DashboardPage.tsx";
import {RequestDetailsPage} from "./pages/RequestDetailsPage.tsx";
// ...

export const App = () => {
    return (
        <AuthProvider>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route
                    path="/*"
                    element={
                        <ProtectedRoute>
                            <Routes>
                                <Route path="/" element={<DashboardPage />} />
                                <Route path="/request/:id" element={<RequestDetailsPage />} />
                                <Route path="*" element={<Navigate to="/" />} />
                            </Routes>
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </AuthProvider>
    );
};