import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { CustomerLayout } from './components/CustomerLayout'
import { LandingPage } from './pages/LandingPage'
import { MenuPage } from './pages/MenuPage'
import { CartPage } from './pages/CartPage'
import { CheckoutPage } from './pages/CheckoutPage'
import { OrderPage } from './pages/OrderPage'
import { ReceiptPage } from './pages/ReceiptPage'

// Worker Pages
import { WorkerLoginPage } from './pages/worker/WorkerLoginPage'
import { CashierDashboard } from './pages/worker/CashierDashboard'
import { FoodServiceDashboard } from './pages/worker/FoodServiceDashboard'
import { WorkerLayout, ProtectedWorkerRoute } from './components/worker/WorkerLayout'

// Admin Pages
import { AdminLoginPage } from './pages/admin/AdminLoginPage'
import { AdminDashboard } from './pages/admin/AdminDashboard'
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage'
import { AdminTransactionsPage } from './pages/admin/AdminTransactionsPage'
import { AdminCategoriesPage } from './pages/admin/AdminCategoriesPage'
import { AdminMenuPage } from './pages/admin/AdminMenuPage'
import { AdminMenuItemPage } from './pages/admin/AdminMenuItemPage'
import { AdminWorkersPage } from './pages/admin/AdminWorkersPage'
import { AdminDailyClosingPage } from './pages/admin/AdminDailyClosingPage'
import { AdminAuditLogsPage } from './pages/admin/AdminAuditLogsPage'
import { AdminAnalyticsPage } from './pages/admin/AdminAnalyticsPage'
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage'
import { AdminLayout, ProtectedAdminRoute } from './components/admin/AdminLayout'

import { CartProvider } from './contexts/CartContext'
import { AuthProvider } from './contexts/AuthContext'

function AppRoutes() {
  const location = useLocation()
  const state = location.state

  // Determine if there is a background location for modal routing
  const backgroundLocation = state && state.backgroundLocation

  return (
    <>
      <Routes location={backgroundLocation || location}>
        <Route element={<CustomerLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/cart" element={<CartPage standalone />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order/:token" element={<OrderPage />} />
          <Route path="/receipt/:token" element={<ReceiptPage />} />
        </Route>

        {/* Worker Routes */}
        <Route path="/worker/login" element={<WorkerLoginPage />} />
        <Route element={<WorkerLayout />}>
          <Route 
            path="/worker/cashier" 
            element={
              <ProtectedWorkerRoute allowedRole="CASHIER">
                <CashierDashboard />
              </ProtectedWorkerRoute>
            } 
          />
          <Route 
            path="/worker/food-service" 
            element={
              <ProtectedWorkerRoute allowedRole="FOOD_SERVICE">
                <FoodServiceDashboard />
              </ProtectedWorkerRoute>
            } 
          />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route element={<AdminLayout />}>
          <Route 
            path="/admin/dashboard" 
            element={
              <ProtectedAdminRoute>
                <AdminDashboard />
              </ProtectedAdminRoute>
            } 
          />
          <Route 
            path="/admin/orders" 
            element={
              <ProtectedAdminRoute>
                <AdminOrdersPage />
              </ProtectedAdminRoute>
            } 
          />
          <Route 
            path="/admin/transactions" 
            element={
              <ProtectedAdminRoute>
                <AdminTransactionsPage />
              </ProtectedAdminRoute>
            } 
          />
          
          <Route 
            path="/admin/menu" 
            element={
              <ProtectedAdminRoute>
                <AdminMenuPage />
              </ProtectedAdminRoute>
            } 
          />
          <Route 
            path="/admin/menu/:id" 
            element={
              <ProtectedAdminRoute>
                <AdminMenuItemPage />
              </ProtectedAdminRoute>
            } 
          />
          <Route 
            path="/admin/categories" 
            element={
              <ProtectedAdminRoute>
                <AdminCategoriesPage />
              </ProtectedAdminRoute>
            } 
          />

          <Route 
            path="/admin/workers" 
            element={
              <ProtectedAdminRoute>
                <AdminWorkersPage />
              </ProtectedAdminRoute>
            } 
          />
          <Route 
            path="/admin/analytics" 
            element={
              <ProtectedAdminRoute>
                <AdminAnalyticsPage />
              </ProtectedAdminRoute>
            } 
          />
          <Route 
            path="/admin/daily-closing" 
            element={
              <ProtectedAdminRoute>
                <AdminDailyClosingPage />
              </ProtectedAdminRoute>
            } 
          />
          <Route 
            path="/admin/audit-logs" 
            element={
              <ProtectedAdminRoute>
                <AdminAuditLogsPage />
              </ProtectedAdminRoute>
            } 
          />
          <Route 
            path="/admin/settings" 
            element={
              <ProtectedAdminRoute>
                <AdminSettingsPage />
              </ProtectedAdminRoute>
            } 
          />
        </Route>
      </Routes>

      {/* Render modal routes over the background route */}
      {backgroundLocation && (
        <Routes>
          <Route path="/cart" element={<CartPage />} />
        </Routes>
      )}
    </>
  )
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  )
}

export default App
