import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../store/authStore'
import {
  LayoutDashboard, Package, Boxes, ClipboardList,
  Factory, ShoppingCart, Truck, BarChart3, LogOut, Users, CreditCard, Settings, Landmark, ShoppingBag, Wallet, UserCheck, Menu, X
} from 'lucide-react'

const navItems = [
  { to: '/',             icon: LayoutDashboard, label: 'Dashboard',    module: null },
  { to: '/raw-materials',icon: Boxes,           label: 'Hammaddeler',  module: 'raw_materials' },
  { to: '/products',     icon: Package,         label: 'Ürünler',      module: 'products' },
  { to: '/bom',          icon: ClipboardList,   label: 'Reçeteler',    module: 'bom' },
  { to: '/production',   icon: Factory,         label: 'Üretim',       module: 'production' },
  { to: '/purchases',    icon: ShoppingBag,     label: 'Satın Alma',   module: 'purchases' },
  { to: '/orders',       icon: ShoppingCart,    label: 'Siparişler',   module: 'orders' },
  { to: '/customers',    icon: Users,           label: 'Müşteriler',   module: 'customers' },
  { to: '/cashflow',     icon: Wallet,          label: 'Kasa / Ciro',  module: 'cashflow' },
  { to: '/payments',     icon: CreditCard,      label: 'Vade Takibi',  module: 'payments' },
  { to: '/debts',        icon: Landmark,        label: 'Borç Takibi',  module: 'debts' },
  { to: '/suppliers',    icon: Truck,           label: 'Tedarikçiler', module: 'suppliers' },
  { to: '/employees',    icon: UserCheck,       label: 'Personel',     module: 'employees' },
  { to: '/reports',      icon: BarChart3,       label: 'Raporlar',     module: 'reports' },
  { to: '/settings',     icon: Settings,        label: 'Ayarlar',      module: null },
]

export default function Layout({ children }) {
  const { user, can, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Sayfa değişince sidebar'ı kapat (mobil)
  useEffect(() => { setSidebarOpen(false) }, [location.pathname])

  const handleLogout = () => { logout(); navigate('/login') }

  const visibleItems = navItems.filter(item =>
    item.module === null ? true : (typeof can === 'function' ? can(item.module, 'view') : true)
  )

  const Sidebar = () => (
    <aside className="w-56 flex flex-col h-full" style={{ backgroundColor: 'var(--bg-sidebar)' }}>
      <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <div>
          <h1 className="text-lg font-bold" style={{ color: 'var(--accent)' }}>Laves Kimya</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-sidebar)' }}>{user?.username} · {user?.role}</p>
        </div>
        {/* Mobilde kapat butonu */}
        <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1" style={{ color: 'var(--text-sidebar)' }}>
          <X size={18} />
        </button>
      </div>
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {visibleItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
            style={({ isActive }) => isActive
              ? { backgroundColor: 'var(--sidebar-active)', color: 'var(--text-sidebar-active)' }
              : { color: 'var(--text-sidebar)' }
            }>
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <button onClick={handleLogout}
          className="flex items-center gap-3 px-5 py-4 w-full text-sm transition-colors hover:opacity-80"
          style={{ color: 'var(--text-sidebar)' }}>
          <LogOut size={16} /> Çıkış
        </button>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen" style={{ backgroundColor: 'var(--bg-app)' }}>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-56 md:flex-col md:h-screen">
        <Sidebar />
      </div>

      {/* Mobil overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-56 z-50">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Ana içerik */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobil header */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b"
          style={{ backgroundColor: 'var(--bg-sidebar)', borderColor: 'rgba(255,255,255,0.08)' }}>
          <button onClick={() => setSidebarOpen(true)} style={{ color: 'var(--accent)' }}>
            <Menu size={22} />
          </button>
          <span className="font-bold text-sm" style={{ color: 'var(--accent)' }}>Laves Kimya ERP</span>
        </div>

        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
