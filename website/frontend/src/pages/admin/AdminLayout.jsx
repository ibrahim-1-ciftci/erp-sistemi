import React, { useEffect, useState } from 'react'
import { Outlet, NavLink, useNavigate, Navigate } from 'react-router-dom'
import { Package, Tag, MessageSquare, Settings, LogOut, LayoutDashboard, ShoppingBag } from 'lucide-react'
import api from '../../api/axios'

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(e) { return { error: e } }
  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-12 text-center">
          <p className="text-red-500 font-semibold mb-2">Bir hata oluştu</p>
          <p className="text-gray-400 text-sm mb-4">{this.state.error?.message}</p>
          <button onClick={() => this.setState({ error: null })}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700 transition-colors">
            Tekrar Dene
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export default function AdminLayout() {
  const navigate = useNavigate()
  const token = localStorage.getItem('laves_admin_token')
  const [unread, setUnread] = useState(0)
  const [pendingOrders, setPendingOrders] = useState(0)

  useEffect(() => {
    if (token) {
      api.get('/contact').then(r => setUnread(r.data.filter(m => !m.is_read).length)).catch(() => {})
      api.get('/orders').then(r => setPendingOrders(r.data.filter(o => o.status === 'pending').length)).catch(() => {})
    }
  }, [token])

  if (!token) return <Navigate to="/admin/login" replace />

  const logout = () => {
    localStorage.removeItem('laves_admin_token')
    navigate('/admin/login')
  }

  const links = [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/admin/products', icon: Package, label: 'Ürünler' },
    { to: '/admin/categories', icon: Tag, label: 'Kategoriler' },
    { to: '/admin/orders', icon: ShoppingBag, label: 'Siparişler', badge: pendingOrders },
    { to: '/admin/messages', icon: MessageSquare, label: 'Mesajlar', badge: unread },
    { to: '/admin/settings', icon: Settings, label: 'Ayarlar' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-56 bg-white border-r border-gray-100 flex flex-col fixed h-full z-10">
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm shadow-blue-500/30">
              <span className="text-white font-bold text-xs">L</span>
            </div>
            <div>
              <span className="font-bold text-gray-900 text-sm">Admin Panel</span>
              <p className="text-xs text-gray-400">Laves Kimya</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {links.map(l => (
            <NavLink key={l.to} to={l.to} end={l.end}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
              <div className="flex items-center gap-3">
                <l.icon size={17} />
                {l.label}
              </div>
              {l.badge > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {l.badge > 9 ? '9+' : l.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-100">
          <a href="/" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors mb-1">
            ↗ Siteyi Görüntüle
          </a>
          <button onClick={logout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors w-full">
            <LogOut size={17} /> Çıkış
          </button>
        </div>
      </aside>
      <main className="flex-1 ml-56 overflow-auto min-h-screen">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  )
}
