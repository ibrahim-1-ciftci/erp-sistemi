import { useEffect, useState } from 'react'
import api from '../api/axios'
import {
  AlertTriangle, ShoppingCart, Factory, Boxes,
  TrendingUp, TrendingDown, Wallet, CreditCard, Landmark,
  ArrowUpRight, ArrowDownRight
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, LineChart, Line, Legend
} from 'recharts'

const fmt = (n, dec = 0) =>
  (n ?? 0).toLocaleString('tr-TR', { maximumFractionDigits: dec })

function KpiCard({ icon: Icon, label, value, sub, color = 'blue', trend }) {
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
    <div className={`bg-gradient-to-br ${bg[color]} rounded-2xl p-5 text-white shadow-lg`}>
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 bg-white/20 rounded-xl"><Icon size={20} /></div>
        {trend !== undefined && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${trend >= 0 ? 'bg-white/20' : 'bg-white/20'}`}>
            {trend >= 0 ? <ArrowUpRight size={12} className="inline" /> : <ArrowDownRight size={12} className="inline" />}
          </span>
        )}
      </div>
      <p className="text-white/70 text-xs mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-white/60 text-xs mt-1">{sub}</p>}
    </div>
  )
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [cashDaily, setCashDaily] = useState([])
  const [error, setError] = useState(false)

  useEffect(() => {
    api.get('/reports/dashboard')
      .then(r => setData(r.data))
      .catch(() => setError(true))
    const from = new Date(); from.setDate(from.getDate() - 13)
    const dateFrom = from.toISOString().split('T')[0]
    api.get('/cashflow/daily-summary', { params: { date_from: dateFrom } })
      .then(r => setCashDaily(r.data))
      .catch(() => {})
  }, [])

  if (error) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <p className="text-gray-500 text-sm">Dashboard verisi yüklenemedi.</p>
        <p className="text-gray-400 text-xs mt-1">Yetkiniz olmayabilir veya bir hata oluştu.</p>
      </div>
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
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-sm text-gray-400">{new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Üst KPI satırı */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Wallet} label="Bu Ay Ciro (Gelir)" color="green"
          value={`₺${fmt(data.monthly_cash_income)}`}
          sub={`Bugün: ₺${fmt(data.today_income)}`} />
        <KpiCard icon={TrendingDown} label="Bu Ay Gider" color="red"
          value={`₺${fmt(data.monthly_cash_expense)}`}
          sub={`Bugün gider: ₺${fmt(data.today_expense)}`} />
        <KpiCard icon={TrendingUp} label="Bu Ay Net Kasa" color={data.monthly_cash_net >= 0 ? 'teal' : 'red'}
          value={`₺${fmt(data.monthly_cash_net)}`}
          sub="Gelir − Gider" />
        <KpiCard icon={CreditCard} label="Toplam Alacak" color="blue"
          value={`₺${fmt(data.total_receivable)}`}
          sub="Vadeli satışlar" />
      </div>

      {/* İkinci KPI satırı */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Landmark} label="Toplam Borç" color="orange"
          value={`₺${fmt(data.total_payable)}`}
          sub="Ödenecek" />

        <KpiCard icon={Boxes} label="Stok Değeri" color="blue"
          value={`₺${fmt(data.total_stock_value)}`}
          sub={`${data.total_materials} hammadde · ${data.total_products} ürün`} />
        <KpiCard icon={ShoppingCart} label="Bekleyen Sipariş" color="yellow"
          value={data.pending_orders}
          sub={`${data.in_production_orders} üretimde`} />
        <KpiCard icon={Factory} label="Bugün Üretim" color="purple"
          value={data.today_production_count}
          sub={`₺${fmt(data.today_production_cost)} maliyet`} />
        <KpiCard icon={AlertTriangle} label="Kritik Stok" color="red"
          value={data.low_stock_count}
          sub="Min seviye altında" />
      </div>

      {/* Grafikler */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Kasa Gelir/Gider — son 14 gün */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-700 mb-4">Son 14 Gün — Kasa Hareketleri</h2>
          {cashDaily.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={cashDaily} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }}
                  tickFormatter={d => d.slice(5)} />
                <YAxis tick={{ fontSize: 10 }}
                  tickFormatter={v => `₺${(v/1000).toFixed(0)}K`} />
                <Tooltip formatter={v => `₺${fmt(v)}`} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="income" fill="#22c55e" name="Gelir" radius={[3,3,0,0]} />
                <Bar dataKey="expense" fill="#ef4444" name="Gider" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-400 text-sm text-center py-12">Henüz kasa kaydı yok</p>}
        </div>

        {/* Üretim Maliyeti — son 6 ay */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-700 mb-4">Son 6 Ay — Üretim Maliyeti</h2>
          {data.monthly_production?.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data.monthly_production}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }}
                  tickFormatter={v => `₺${(v/1000).toFixed(0)}K`} />
                <Tooltip formatter={v => `₺${fmt(v)}`} />
                <Line type="monotone" dataKey="cost" stroke="#3b82f6"
                  strokeWidth={2} dot={{ r: 4 }} name="Maliyet" />
              </LineChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-400 text-sm text-center py-12">Henüz üretim kaydı yok</p>}
        </div>
      </div>

      {/* Kritik Stok */}
      {data.low_stock_items?.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-5">
          <h2 className="font-semibold text-red-600 flex items-center gap-2 mb-4">
            <AlertTriangle size={18} /> Kritik Stok Uyarıları
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.low_stock_items.map(item => {
              const pct = item.min_stock_level > 0
                ? Math.min((item.stock_quantity / item.min_stock_level) * 100, 100)
                : 0
              return (
                <div key={item.id} className="bg-red-50 rounded-xl p-3 border border-red-100">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-sm text-gray-800">{item.name}</span>
                    <span className="text-xs text-red-600 font-bold">{item.stock_quantity} {item.unit}</span>
                  </div>
                  <div className="w-full bg-red-200 rounded-full h-1.5 mb-1">
                    <div className="bg-red-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs text-gray-400">Min: {item.min_stock_level} {item.unit}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
