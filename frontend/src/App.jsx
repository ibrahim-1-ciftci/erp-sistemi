import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './store/authStore'
import { ThemeProvider } from './store/themeStore'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Orders from './pages/Orders'
import Reports from './pages/Reports'
import Customers from './pages/Customers'
import Payments from './pages/Payments'
import Debts from './pages/Debts'
import Settings from './pages/Settings'
import Employees from './pages/Employees'

function PrivateRoute({ children }) {
  const { user } = useAuth()
  return user ? <Layout>{children}</Layout> : <Navigate to="/login" />
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/products" element={<PrivateRoute><Products /></PrivateRoute>} />
      <Route path="/orders" element={<PrivateRoute><Orders /></PrivateRoute>} />
      <Route path="/customers" element={<PrivateRoute><Customers /></PrivateRoute>} />
      <Route path="/payments" element={<PrivateRoute><Payments /></PrivateRoute>} />
      <Route path="/debts" element={<PrivateRoute><Debts /></PrivateRoute>} />
      <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
      <Route path="/employees" element={<PrivateRoute><Employees /></PrivateRoute>} />
      <Route path="/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
      {/* Eski URL'lere gelen istekleri dashboard'a yönlendir */}
      <Route path="/raw-materials" element={<Navigate to="/" />} />
      <Route path="/bom" element={<Navigate to="/" />} />
      <Route path="/production" element={<Navigate to="/" />} />
      <Route path="/purchases" element={<Navigate to="/" />} />
      <Route path="/cashflow" element={<Navigate to="/" />} />
      <Route path="/suppliers" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Toaster position="top-right" />
        <AppRoutes />
      </AuthProvider>
    </ThemeProvider>
  )
}
