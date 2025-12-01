// src/components/auth/ProtectedRoute.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { Spinner } from '../ui/Spinner';
import { Option } from 'effect';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { auth, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Spinner size="lg" />
            </div>
        );
    }

    if (Option.isNone(auth)) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};