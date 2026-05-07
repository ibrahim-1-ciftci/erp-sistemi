import React from 'react'
import { Outlet, NavLink, useNavigate, Navigate } from 'react-router-dom'
import { Package, Tag, MessageSquare, Settings, LogOut, BookOpen } from 'lucide-react'

// Crash'leri yakala, sayfayı beyaz bırakma
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(e) { return { error: e } }
  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-12 text-center">
          <p className="text-red-500 font-semibold mb-2">Bir hata oluştu</p>
          <p className="text-gray-400 text-sm mb-4">{this.state.error?.message}</p>
          <button
            onClick={() => this.setState({ error: null })}
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

  if (!token) {
    return <Navigate to="/admin/login" replace />
  }

  const logout = () => {
    localStorage.removeItem('laves_admin_token')
    navigate('/admin/login')
  }

  const links = [
    { to: '/admin/products', icon: Package, label: 'Ürünler' },
    { to: '/admin/categories', icon: Tag, label: 'Kategoriler' },
    { to: '/admin/blog', icon: BookOpen, label: 'Blog' },
    { to: '/admin/messages', icon: MessageSquare, label: 'Mesajlar' },
    { to: '/admin/settings', icon: Settings, label: 'Ayarlar' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-56 bg-white border-r border-gray-100 flex flex-col">
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">L</span>
            </div>
            <span className="font-bold text-gray-900">Admin Panel</span>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {links.map(l => (
            <NavLink key={l.to} to={l.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}>
              <l.icon size={17} />
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-100">
          <button onClick={logout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors w-full">
            <LogOut size={17} /> Çıkış
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  )
}
