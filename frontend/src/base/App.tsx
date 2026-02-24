import { memo } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AdminLayout from "@/shared/layouts/AdminLayout";
import DashboardPage from "@/features/dashboard/pages/DashboardPage";
import OrderPage from "@/features/orders/pages/OrderPage";

const App = memo(function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="orders" element={<OrderPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
});

export default App;
