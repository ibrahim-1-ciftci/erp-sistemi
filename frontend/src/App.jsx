import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './store/authStore'
import { ThemeProvider } from './store/themeStore'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import RawMaterials from './pages/RawMaterials'
import Products from './pages/Products'
import BOM from './pages/BOM'
import Production from './pages/Production'
import Orders from './pages/Orders'
import Suppliers from './pages/Suppliers'
import Reports from './pages/Reports'
import Customers from './pages/Customers'
import Payments from './pages/Payments'
import Debts from './pages/Debts'
import Purchases from './pages/Purchases'
import Cashflow from './pages/Cashflow'
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
      <Route path="/raw-materials" element={<PrivateRoute><RawMaterials /></PrivateRoute>} />
      <Route path="/products" element={<PrivateRoute><Products /></PrivateRoute>} />
      <Route path="/bom" element={<PrivateRoute><BOM /></PrivateRoute>} />
      <Route path="/production" element={<PrivateRoute><Production /></PrivateRoute>} />
      <Route path="/orders" element={<PrivateRoute><Orders /></PrivateRoute>} />
      <Route path="/suppliers" element={<PrivateRoute><Suppliers /></PrivateRoute>} />
      <Route path="/customers" element={<PrivateRoute><Customers /></PrivateRoute>} />
      <Route path="/payments" element={<PrivateRoute><Payments /></PrivateRoute>} />
      <Route path="/debts" element={<PrivateRoute><Debts /></PrivateRoute>} />
      <Route path="/purchases" element={<PrivateRoute><Purchases /></PrivateRoute>} />
      <Route path="/cashflow" element={<PrivateRoute><Cashflow /></PrivateRoute>} />
      <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
      <Route path="/employees" element={<PrivateRoute><Employees /></PrivateRoute>} />
      <Route path="/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
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
