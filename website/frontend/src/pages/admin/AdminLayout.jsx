import React, { useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { Package, Tag, MessageSquare, Settings, LogOut } from 'lucide-react'

export default function AdminLayout() {
  const navigate = useNavigate()

  useEffect(() => {
    if (!localStorage.getItem('laves_admin_token')) navigate('/admin/login')
  }, [])

  const logout = () => {
    localStorage.removeItem('laves_admin_token')
    navigate('/admin/login')
  }

  const links = [
    { to: '/admin/products', icon: Package, label: 'Ürünler' },
    { to: '/admin/categories', icon: Tag, label: 'Kategoriler' },
    { to: '/admin/messages', icon: MessageSquare, label: 'Mesajlar' },
    { to: '/admin/settings', icon: Settings, label: 'Ayarlar' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
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

      {/* Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
