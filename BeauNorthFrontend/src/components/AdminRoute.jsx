import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/useAuth";

export default function AdminRoute() {
    const { user, loading, isAuthenticated } = useAuth();

    if (loading) {
        return null;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (user?.role !== "Admin") {
        return <Navigate to="/access-denied" replace />;
    }

    return <Outlet />;
}