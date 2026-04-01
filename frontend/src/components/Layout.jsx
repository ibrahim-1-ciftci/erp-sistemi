import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../store/authStore'
import {
  LayoutDashboard, Package, Boxes, ClipboardList,
  Factory, ShoppingCart, Truck, BarChart3, LogOut, Users, CreditCard, Settings, Landmark, ShoppingBag
} from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/raw-materials', icon: Boxes, label: 'Hammaddeler' },
  { to: '/products', icon: Package, label: 'Ürünler' },
  { to: '/bom', icon: ClipboardList, label: 'Reçeteler' },
  { to: '/production', icon: Factory, label: 'Üretim' },
  { to: '/purchases', icon: ShoppingBag, label: 'Satın Alma' },
  { to: '/orders', icon: ShoppingCart, label: 'Siparişler' },
  { to: '/customers', icon: Users, label: 'Müşteriler' },
  { to: '/payments', icon: CreditCard, label: 'Vade Takibi' },
  { to: '/debts', icon: Landmark, label: 'Borç Takibi' },
  { to: '/suppliers', icon: Truck, label: 'Tedarikçiler' },
  { to: '/reports', icon: BarChart3, label: 'Raporlar' },
  { to: '/settings', icon: Settings, label: 'Ayarlar' },
]

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-56 bg-gray-900 text-white flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-lg font-bold text-blue-400">Laves Kimya</h1>
          <p className="text-xs text-gray-400 mt-1">{user?.username} · {user?.role}</p>
        </div>
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'
                }`}>
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-gray-700">
          <button onClick={handleLogout}
            className="flex items-center gap-3 px-5 py-4 w-full text-sm text-gray-400 hover:text-white">
            <LogOut size={16} /> Çıkış
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}
