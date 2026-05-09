import React from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import WhatsAppButton from './components/WhatsAppButton'
import Home from './pages/Home'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import About from './pages/About'
import Contact from './pages/Contact'
import AdminLogin from './pages/admin/AdminLogin'
import AdminLayout from './pages/admin/AdminLayout'
import AdminProducts from './pages/admin/AdminProducts'
import AdminProductForm from './pages/admin/AdminProductForm'
import AdminCategories from './pages/admin/AdminCategories'
import AdminMessages from './pages/admin/AdminMessages'
import AdminSettings from './pages/admin/AdminSettings'
import AdminDashboard from './pages/admin/AdminDashboard'
import ChatBot from './components/ChatBot'
import Privacy from './pages/legal/Privacy'
import SalesContract from './pages/legal/SalesContract'
import Returns from './pages/legal/Returns'
import Shipping from './pages/legal/Shipping'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import OrderSuccess from './pages/OrderSuccess'

function PageWrapper({ children }) {
  const location = useLocation()
  return (
    <div key={location.pathname} className="page-enter">
      {children}
    </div>
  )
}

function PublicLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <PageWrapper>{children}</PageWrapper>
      </main>
      <Footer />
      <WhatsAppButton />
      <ChatBot />
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
      <Route path="/urunler" element={<PublicLayout><Products /></PublicLayout>} />
      <Route path="/urun/:id" element={<PublicLayout><ProductDetail /></PublicLayout>} />
      <Route path="/hakkimizda" element={<PublicLayout><About /></PublicLayout>} />
      <Route path="/iletisim" element={<PublicLayout><Contact /></PublicLayout>} />
      <Route path="/gizlilik-politikasi" element={<PublicLayout><Privacy /></PublicLayout>} />
      <Route path="/mesafeli-satis-sozlesmesi" element={<PublicLayout><SalesContract /></PublicLayout>} />
      <Route path="/iade-iptal" element={<PublicLayout><Returns /></PublicLayout>} />
      <Route path="/teslimat" element={<PublicLayout><Shipping /></PublicLayout>} />
      <Route path="/sepet" element={<PublicLayout><Cart /></PublicLayout>} />
      <Route path="/siparis" element={<PublicLayout><Checkout /></PublicLayout>} />
      <Route path="/siparis-tamamlandi" element={<PublicLayout><OrderSuccess /></PublicLayout>} />

      {/* Admin */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="products/new" element={<AdminProductForm />} />
        <Route path="products/:id" element={<AdminProductForm />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="messages" element={<AdminMessages />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>
    </Routes>
  )
}
