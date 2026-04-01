import { useEffect, useState } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Download, Filter } from 'lucide-react'

const today = new Date().toISOString().split('T')[0]
const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

export default function Reports() {
  const [movements, setMovements] = useState([])
  const [movTotal, setMovTotal] = useState(0)
  const [profitability, setProfitability] = useState([])
  const [logs, setLogs] = useState([])
  const [logTotal, setLogTotal] = useState(0)
  const [tab, setTab] = useState('movements')
  const [dateFrom, setDateFrom] = useState(monthStart)
  const [dateTo, setDateTo] = useState(today)

  const params = () => ({ date_from: dateFrom || undefined, date_to: dateTo || undefined, limit: 200 })

  const loadAll = () => {
    api.get('/reports/stock-movements', { params: params() }).then(r => { setMovements(r.data.items); setMovTotal(r.data.total) })
    api.get('/reports/profitability', { params: params() }).then(r => setProfitability(r.data))
    api.get('/reports/activity-logs', { params: params() }).then(r => { setLogs(r.data.items); setLogTotal(r.data.total) })
  }

  useEffect(() => { loadAll() }, [dateFrom, dateTo])

  const exportFile = async (endpoint, filename) => {
    try {
      const token = localStorage.getItem('token')
      const p = new URLSearchParams()
      if (dateFrom) p.append('date_from', dateFrom)
      if (dateTo) p.append('date_to', dateTo)
      const res = await fetch(`/api/reports/export/${endpoint}?${p}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
      URL.revokeObjectURL(url)
    } catch { toast.error('Export başarısız') }
  }

  const tabs = [
    { key: 'movements', label: 'Stok Hareketleri' },
    { key: 'profitability', label: 'Karlılık' },
    { key: 'logs', label: 'Aktivite Logları' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Raporlar</h1>

      {/* Filtre Çubuğu */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4 flex flex-wrap items-center gap-3">
        <Filter size={16} className="text-gray-400" />
        <div className="flex items-center gap-2 text-sm">
          <label className="text-gray-500">Başlangıç:</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="border rounded-lg px-3 py-1.5 text-sm" />
        </div>
        <div className="flex items-center gap-2 text-sm">
          <label className="text-gray-500">Bitiş:</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="border rounded-lg px-3 py-1.5 text-sm" />
        </div>
        <button onClick={() => { setDateFrom(''); setDateTo('') }}
          className="text-xs text-blue-600 hover:underline">Filtreyi Temizle</button>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.key ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {tab === 'movements' && (
            <button onClick={() => exportFile('stock-movements', 'stok_hareketleri.xlsx')}
              className="flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-700">
              <Download size={14} /> Excel
            </button>
          )}
          {tab === 'profitability' && (
            <button onClick={() => exportFile('profitability', 'karlilik_raporu.xlsx')}
              className="flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-700">
              <Download size={14} /> Excel
            </button>
          )}
        </div>
      </div>

      {tab === 'movements' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-500 mb-3">Toplam {movTotal} kayıt</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>{['Tarih','Tür','Malzeme/Ürün','Miktar','Açıklama'].map(h =>
                  <th key={h} className="px-4 py-3 text-left font-medium text-gray-600">{h}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {movements.map(m => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{new Date(m.created_at).toLocaleString('tr-TR')}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${m.type === 'in' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {m.type === 'in' ? 'Giriş' : 'Çıkış'}
                      </span>
                    </td>
                    <td className="px-4 py-3">{m.material_name || m.product_name || '-'}</td>
                    <td className="px-4 py-3">{m.quantity}</td>
                    <td className="px-4 py-3 text-gray-500">{m.description || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'profitability' && (
        <div className="space-y-4">
          {profitability.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <h3 className="font-semibold mb-4">Üretim Karlılığı Grafiği</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={profitability.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="product_name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={v => `₺${v?.toFixed(2)}`} />
                  <Bar dataKey="profit" fill="#3b82f6" name="Kâr" />
                  <Bar dataKey="total_cost" fill="#e5e7eb" name="Maliyet" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>{['Ürün','Adet','Maliyet','Gelir','Kâr','Marj','Tarih'].map(h =>
                  <th key={h} className="px-4 py-3 text-left font-medium text-gray-600">{h}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {profitability.map(p => (
                  <tr key={p.production_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{p.product_name}</td>
                    <td className="px-4 py-3">{p.quantity}</td>
                    <td className="px-4 py-3">₺{p.total_cost?.toFixed(2)}</td>
                    <td className="px-4 py-3">₺{p.revenue?.toFixed(2)}</td>
                    <td className={`px-4 py-3 font-medium ${p.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>₺{p.profit?.toFixed(2)}</td>
                    <td className="px-4 py-3">{p.margin_pct?.toFixed(1)}%</td>
                    <td className="px-4 py-3 text-gray-500">{p.completed_at ? new Date(p.completed_at).toLocaleDateString('tr-TR') : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'logs' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-500 mb-3">Toplam {logTotal} kayıt</p>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>{['Tarih','İşlem','Varlık','ID','Detay'].map(h =>
                <th key={h} className="px-4 py-3 text-left font-medium text-gray-600">{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map(l => (
                <tr key={l.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{new Date(l.created_at).toLocaleString('tr-TR')}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-mono">{l.action}</span></td>
                  <td className="px-4 py-3">{l.entity || '-'}</td>
                  <td className="px-4 py-3">{l.entity_id || '-'}</td>
                  <td className="px-4 py-3 text-gray-500 truncate max-w-xs">{l.details || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
