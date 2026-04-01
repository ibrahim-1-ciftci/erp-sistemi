import { useEffect, useState } from 'react'
import api from '../api/axios'
import { AlertTriangle, ShoppingCart, Factory, Boxes, TrendingUp, TrendingDown, CreditCard, Landmark } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

function StatCard({ icon: Icon, label, value, color = 'blue', sub }) {
  const colors = {
    blue:   'bg-blue-50 text-blue-600',
    green:  'bg-green-50 text-green-600',
    red:    'bg-red-50 text-red-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  }
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg ${colors[color]}`}><Icon size={20} /></div>
        <span className="text-sm text-gray-500">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

export default function Dashboard() {
  const [data, setData] = useState(null)

  useEffect(() => {
    api.get('/reports/dashboard').then(r => setData(r.data))
  }, [])

  if (!data) return <div className="text-center py-20 text-gray-400">Yükleniyor...</div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Ana istatistikler */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Boxes} label="Toplam Stok Değeri"
          value={`₺${data.total_stock_value?.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`} color="blue" />
        <StatCard icon={ShoppingCart} label="Bekleyen Sipariş"
          value={data.pending_orders} color="yellow" sub={`${data.in_production_orders} üretimde`} />
        <StatCard icon={Factory} label="Bugün Üretim"
          value={data.today_production_count} color="green"
          sub={`₺${data.today_production_cost?.toFixed(0)} maliyet`} />
        <StatCard icon={AlertTriangle} label="Kritik Stok"
          value={data.low_stock_count} color="red" sub="Minimum altında" />
      </div>

      {/* Vade & Borç özeti */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-green-50 rounded-xl"><TrendingUp size={24} className="text-green-600" /></div>
          <div>
            <p className="text-sm text-gray-500">Toplam Alacak (Vade)</p>
            <p className="text-2xl font-bold text-green-600">
              ₺{data.total_receivable?.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-red-50 rounded-xl"><TrendingDown size={24} className="text-red-600" /></div>
          <div>
            <p className="text-sm text-gray-500">Toplam Borç</p>
            <p className="text-2xl font-bold text-red-600">
              ₺{data.total_payable?.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>
      </div>

      {/* Aylık Üretim Maliyeti Grafiği */}
      {data.monthly_production?.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-semibold mb-4">Son 6 Ay Üretim Maliyeti</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.monthly_production}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `₺${(v/1000).toFixed(0)}K`} />
              <Tooltip formatter={v => [`₺${v?.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`, 'Maliyet']} />
              <Bar dataKey="cost" fill="#3b82f6" radius={[4,4,0,0]} name="Maliyet" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Kritik Stok Uyarıları */}
      {data.low_stock_items?.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-red-100 p-5">
          <h2 className="font-semibold text-red-600 flex items-center gap-2 mb-4">
            <AlertTriangle size={18} /> Kritik Stok Uyarıları
          </h2>
          <div className="space-y-2">
            {data.low_stock_items.map(item => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <span className="font-medium">{item.name}</span>
                <div className="text-sm text-right">
                  <span className="text-red-600 font-bold">{item.stock_quantity} {item.unit}</span>
                  <span className="text-gray-400 ml-2">/ min {item.min_stock_level}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
