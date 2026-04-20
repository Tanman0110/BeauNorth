import { BrowserRouter, Route, Routes } from "react-router-dom";
import AuthProvider from "./context/AuthProvider";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AdminRoute from "./components/AdminRoute";
import HomePage from "./pages/HomePage";
import ProductsPage from "./pages/ProductsPage";
import ProductDetailsPage from "./pages/ProductDetailsPage";
import CategoriesPage from "./pages/CategoriesPage";
import CategoryPage from "./pages/CategoryPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrdersPage from "./pages/OrdersPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import AccountPage from "./pages/AccountPage";
import AccessDeniedPage from "./pages/AccessDeniedPage";
import AdminCatalogPage from "./pages/AdminCatalogPage";
import "./App.css";

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <div className="app-shell">
                    <Navbar />

                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/products" element={<ProductsPage />} />
                        <Route path="/products/:id" element={<ProductDetailsPage />} />
                        <Route path="/categories" element={<CategoriesPage />} />
                        <Route path="/categories/:id" element={<CategoryPage />} />
                        <Route path="/cart" element={<CartPage />} />
                        <Route path="/checkout" element={<CheckoutPage />} />
                        <Route path="/orders" element={<OrdersPage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />
                        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                        <Route path="/reset-password" element={<ResetPasswordPage />} />
                        <Route path="/account" element={<AccountPage />} />
                        <Route path="/access-denied" element={<AccessDeniedPage />} />

                        <Route element={<AdminRoute />}>
                            <Route path="/admin/catalog" element={<AdminCatalogPage />} />
                        </Route>
                    </Routes>

                    <Footer />
                </div>
            </AuthProvider>
        </BrowserRouter>
    );
}