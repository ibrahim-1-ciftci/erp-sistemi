import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import {
  ShoppingCart, Users, Package, CreditCard, Landmark,
  AlertTriangle, CheckCircle, Clock, TrendingUp
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'

const fmt = (n, dec = 0) => (n ?? 0).toLocaleString('tr-TR', { maximumFractionDigits: dec })

function KpiCard({ icon: Icon, label, value, sub, color = 'blue', onClick }) {
  const bg = {
    blue:   'from-blue-500 to-blue-600',
    green:  'from-green-500 to-green-600',
    red:    'from-red-500 to-red-600',
    yellow: 'from-yellow-500 to-yellow-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
    teal:   'from-teal-500 to-teal-600',
  }
  return (
    <div
      onClick={onClick}
      className={`bg-gradient-to-br ${bg[color]} rounded-2xl p-5 text-white shadow-lg ${onClick ? 'cursor-pointer hover:scale-[1.02] transition-transform' : ''}`}>
      <div className="p-2 bg-white/20 rounded-xl w-fit mb-3"><Icon size={20} /></div>
      <p className="text-white/70 text-xs mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-white/60 text-xs mt-1">{sub}</p>}
    </div>
  )
}

const statusLabel = s => ({
  pending: 'Bekliyor', in_production: 'Üretimde',
  completed: 'Tamamlandı', shipped: 'Sevkiyatta', cancelled: 'İptal'
}[s] || s)

const statusColor = s => ({
  pending:       'bg-yellow-100 text-yellow-700',
  in_production: 'bg-blue-100 text-blue-700',
  completed:     'bg-green-100 text-green-700',
  shipped:       'bg-purple-100 text-purple-700',
  cancelled:     'bg-red-100 text-red-700',
}[s] || 'bg-gray-100 text-gray-600')

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/reports/dashboard')
      .then(r => setData(r.data))
      .catch(() => setError(true))
  }, [])

  if (error) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-gray-400 text-sm">Dashboard verisi yüklenemedi.</p>
    </div>
  )

  if (!data) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-400 text-sm">Yükleniyor...</p>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Dashboard</h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Sipariş KPI'ları */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Clock} label="Bekleyen Sipariş" color="yellow"
          value={data.pending_orders}
          sub="İşlem bekliyor"
          onClick={() => navigate('/orders')} />
        <KpiCard icon={CheckCircle} label="Tamamlanan" color="green"
          value={data.completed_orders}
          sub="Hazır / Teslim edildi"
          onClick={() => navigate('/orders')} />
        <KpiCard icon={ShoppingCart} label="Bu Ay Sipariş" color="blue"
          value={data.month_orders}
          sub={`Toplam: ${data.total_orders}`}
          onClick={() => navigate('/orders')} />
        <KpiCard icon={Users} label="Müşteriler" color="teal"
          value={data.total_customers}
          sub={`${data.total_products} ürün çeşidi`}
          onClick={() => navigate('/customers')} />
      </div>

      {/* Finansal KPI'lar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={CreditCard} label="Toplam Alacak" color="blue"
          value={`₺${fmt(data.total_receivable)}`}
          sub="Vadeli satışlar"
          onClick={() => navigate('/payments')} />
        <KpiCard icon={AlertTriangle} label="Gecikmiş Alacak" color="red"
          value={data.overdue_payments}
          sub="Vadesi geçmiş"
          onClick={() => navigate('/payments')} />
        <KpiCard icon={Landmark} label="Toplam Borç" color="orange"
          value={`₺${fmt(data.total_payable)}`}
          sub="Ödenecek"
          onClick={() => navigate('/debts')} />
        <KpiCard icon={TrendingUp} label="Gecikmiş Borç" color="purple"
          value={data.overdue_debts}
          sub="Vadesi geçmiş"
          onClick={() => navigate('/debts')} />
      </div>

      {/* Grafik + Son Siparişler */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Son 6 ay sipariş grafiği */}
        <div className="rounded-2xl shadow-sm border p-5" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <h2 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Son 6 Ay — Sipariş Sayısı</h2>
          {data.monthly_orders?.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.monthly_orders} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }}
                  labelStyle={{ color: 'var(--text-primary)' }}
                  formatter={v => [`${v} sipariş`, 'Adet']} />
                <Bar dataKey="count" fill="#3b82f6" name="Sipariş" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-center py-12" style={{ color: 'var(--text-secondary)' }}>Henüz sipariş yok</p>}
        </div>

        {/* Son 5 sipariş */}
        <div className="rounded-2xl shadow-sm border p-5" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Son Siparişler</h2>
            <button onClick={() => navigate('/orders')}
              className="text-xs font-medium" style={{ color: 'var(--accent)' }}>
              Tümünü Gör →
            </button>
          </div>
          {data.recent_orders?.length > 0 ? (
            <div className="space-y-2">
              {data.recent_orders.map(o => (
                <div key={o.id}
                  onClick={() => navigate('/orders')}
                  className="flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors hover:opacity-80"
                  style={{ backgroundColor: 'var(--bg-table-head)' }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      #{o.id} — {o.customer_name}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                      {new Date(o.created_at).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {o.total_value > 0 && (
                      <span className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>
                        ₺{fmt(o.total_value, 2)}
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(o.status)}`}>
                      {statusLabel(o.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-center py-12" style={{ color: 'var(--text-secondary)' }}>Henüz sipariş yok</p>
          )}
        </div>
      </div>
    </div>
  )
}
