import { memo } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/features/auth/context/AuthContext";
import { ProtectedRoute } from "@/features/auth/components/ProtectedRoute";
import LoginPage from "@/features/auth/pages/LoginPage";
import AdminLayout from "@/shared/layouts/AdminLayout";
import DashboardPage from "@/features/dashboard/pages/DashboardPage";
import OrderPage from "@/features/orders/pages/OrderPage";
import ProductPage from "@/features/products/pages/ProductPage";
import CreateProductPage from "@/features/products/pages/CreateProductPage";
import AddSalePeriodPage from "@/features/products/pages/AddSalePeriodPage";
import SalePeriodListPage from "@/features/products/pages/SalePeriodListPage";
import SalePeriodStatusReportPage from "@/features/products/pages/SalePeriodStatusReportPage";
import SalePeriodImportPage from "@/features/products/pages/SalePeriodImportPage";
import SalePeriodStatusReportProfitColorsPage from "@/features/products/pages/SalePeriodStatusReportProfitColorsPage";
import ChangePasswordPage from "@/features/users/pages/ChangePasswordPage";
import ProfilePage from "@/features/users/pages/ProfilePage";
import UserPage from "@/features/users/pages/UserPage";
// import { AIPageBuilderPage } from "@/features/ai-page-builder/pages/AIPageBuilderPage";

const App = memo(function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="orders" element={<OrderPage />} />
            <Route path="products" element={<ProductPage />} />
            <Route path="products/new" element={<CreateProductPage />} />
            <Route path="products/sale-periods" element={<SalePeriodListPage />} />
            <Route path="products/sale-periods/import" element={<SalePeriodImportPage />} />
            <Route
              path="products/sale-periods/status-report/profit-colors"
              element={<SalePeriodStatusReportProfitColorsPage />}
            />
            <Route
              path="products/sale-periods/status-report"
              element={<SalePeriodStatusReportPage />}
            />
            <Route path="products/add-sale-period" element={<AddSalePeriodPage />} />
            {/* <Route path="ai-page-builder" element={<AIPageBuilderPage />} /> */}
            <Route path="users" element={<UserPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="profile/change-password" element={<ChangePasswordPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
});

export default App;
