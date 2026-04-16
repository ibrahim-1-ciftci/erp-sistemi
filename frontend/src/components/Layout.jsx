import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../store/authStore'
import {
  LayoutDashboard, Package, Boxes, ClipboardList,
  Factory, ShoppingCart, Truck, BarChart3, LogOut, Users, CreditCard, Settings, Landmark, ShoppingBag, Wallet, UserCheck
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
  { to: '/employees',    icon: UserCheck,       label: 'Personel',     module: null },
  { to: '/reports',      icon: BarChart3,       label: 'Raporlar',     module: 'reports' },
  { to: '/settings',     icon: Settings,        label: 'Ayarlar',      module: null },
]

export default function Layout({ children }) {
  const { user, can, logout } = useAuth()
  const navigate = useNavigate()
  const handleLogout = () => { logout(); navigate('/login') }

  const visibleItems = navItems.filter(item =>
    item.module === null ? true : (typeof can === 'function' ? can(item.module, 'view') : true)
  )

  return (
    <div className="flex h-screen" style={{ backgroundColor: 'var(--bg-app)' }}>
      <aside className="w-56 flex flex-col" style={{ backgroundColor: 'var(--bg-sidebar)' }}>
        <div className="p-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <h1 className="text-lg font-bold" style={{ color: 'var(--accent)' }}>Laves Kimya</h1>
          <p className="text-xs mt-1" style={{ color: 'var(--text-sidebar)' }}>{user?.username} · {user?.role}</p>
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
      <main className="flex-1 overflow-auto">
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}
