import { useEffect, useState } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'
import Modal from '../components/Modal'
import { Plus, Download, Trash2, Edit2, TrendingUp, TrendingDown, Wallet, Filter } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

const today = new Date().toISOString().split('T')[0]
const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

const PAY_LABELS = { cash: 'Nakit', pos: 'POS/Kart', elden: 'Elden', other: 'Diğer' }
const PAY_COLORS = { cash: 'bg-green-100 text-green-700', pos: 'bg-blue-100 text-blue-700', elden: 'bg-purple-100 text-purple-700', other: 'bg-gray-100 text-gray-600' }

const emptyForm = { flow_date: today, flow_type: 'income', pay_method: 'cash', amount: '', description: '', category: '' }

export default function Cashflow() {
  const [items, setItems]     = useState([])
  const [summary, setSummary] = useState({ total_income: 0, total_expense: 0, net: 0, cash_income: 0, pos_income: 0, elden_income: 0 })
  const [daily, setDaily]     = useState([])
  const [dateFrom, setDateFrom] = useState(monthStart)
  const [dateTo, setDateTo]     = useState(today)
  const [typeFilter, setTypeFilter] = useState('')
  const [modal, setModal]     = useState(null)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm]       = useState(emptyForm)

  const load = () => {
    const p = { date_from: dateFrom || undefined, date_to: dateTo || undefined, flow_type: typeFilter || undefined }
    api.get('/cashflow', { params: p }).then(r => { setItems(r.data.items); setSummary(r.data) })
    api.get('/cashflow/daily-summary', { params: { date_from: dateFrom || undefined, date_to: dateTo || undefined } })
      .then(r => setDaily(r.data))
  }

  useEffect(() => { load() }, [dateFrom, dateTo, typeFilter])

  const handleSave = async () => {
    if (!form.amount || !form.flow_date) return toast.error('Tarih ve tutar zorunlu')
    try {
      if (modal === 'edit') await api.put(`/cashflow/${editItem.id}`, { ...form, amount: Number(form.amount) })
      else await api.post('/cashflow', { ...form, amount: Number(form.amount) })
      toast.success('Kaydedildi'); setModal(null); load()
    } catch (e) { toast.error(e.response?.data?.detail || 'Hata') }
  }

  const handleDelete = async id => {
    if (!confirm('Silmek istediğinize emin misiniz?')) return
    try { await api.delete(`/cashflow/${id}`); toast.success('Silindi'); load() }
    catch { toast.error('Hata') }
  }

  const exportExcel = async () => {
    try {
      const token = localStorage.getItem('token')
      const p = new URLSearchParams()
      if (dateFrom) p.append('date_from', dateFrom)
      if (dateTo) p.append('date_to', dateTo)
      const res = await fetch(`/api/cashflow/export?${p}`, { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = 'kasa_hareketleri.xlsx'; a.click()
      URL.revokeObjectURL(url)
    } catch { toast.error('Export başarısız') }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Kasa & Ciro Takibi</h1>
        <div className="flex gap-2">
          <button onClick={exportExcel} className="flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 text-sm">
            <Download size={15} /> Excel
          </button>
          <button onClick={() => { setForm(emptyForm); setEditItem(null); setModal('create') }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
            <Plus size={16} /> Yeni Kayıt
          </button>
        </div>
      </div>

      {/* Özet kartlar */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 col-span-1">
          <div className="p-2 bg-green-50 rounded-lg"><TrendingUp size={18} className="text-green-600" /></div>
          <div>
            <p className="text-xs text-gray-500">Toplam Gelir</p>
            <p className="text-lg font-bold text-green-600">₺{summary.total_income?.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="p-2 bg-red-50 rounded-lg"><TrendingDown size={18} className="text-red-600" /></div>
          <div>
            <p className="text-xs text-gray-500">Toplam Gider</p>
            <p className="text-lg font-bold text-red-600">₺{summary.total_expense?.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</p>
          </div>
        </div>
        <div className={`rounded-xl border-2 shadow-sm p-4 flex items-center gap-3 ${summary.net >= 0 ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50'}`}>
          <div className={`p-2 rounded-lg ${summary.net >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
            <Wallet size={18} className={summary.net >= 0 ? 'text-green-700' : 'text-red-700'} />
          </div>
          <div>
            <p className="text-xs text-gray-600 font-medium">Net Kasa (Gelir − Gider)</p>
            <p className={`text-lg font-bold ${summary.net >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              ₺{summary.net?.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3">
          <p className="text-xs text-gray-500 mb-1">Nakit Gelir</p>
          <p className="font-bold text-sm">₺{summary.cash_income?.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</p>
          <p className="text-xs text-gray-500 mt-1">POS Gelir</p>
          <p className="font-bold text-sm">₺{summary.pos_income?.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3">
          <p className="text-xs text-gray-500 mb-1">Elden Gelir</p>
          <p className="font-bold text-sm">₺{summary.elden_income?.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</p>
        </div>
      </div>

      {/* Grafik */}
      {daily.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <h3 className="font-semibold mb-3 text-sm">Günlük Gelir / Gider</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `₺${(v/1000).toFixed(0)}K`} />
              <Tooltip formatter={v => `₺${v?.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`} />
              <Bar dataKey="income" fill="#22c55e" name="Gelir" radius={[3,3,0,0]} />
              <Bar dataKey="expense" fill="#ef4444" name="Gider" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Filtreler */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4 flex flex-wrap items-center gap-3">
        <Filter size={15} className="text-gray-400" />
        <input type="date" className="border rounded-lg px-3 py-1.5 text-sm" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        <span className="text-gray-400 text-sm">—</span>
        <input type="date" className="border rounded-lg px-3 py-1.5 text-sm" value={dateTo} onChange={e => setDateTo(e.target.value)} />
        <div className="flex gap-1">
          {[['', 'Tümü'], ['income', 'Gelir'], ['expense', 'Gider']].map(([v, l]) => (
            <button key={v} onClick={() => setTypeFilter(v)}
              className={`px-3 py-1 rounded-lg text-xs border ${typeFilter === v ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}>{l}</button>
          ))}
        </div>
      </div>

      {/* Tablo */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>{['Tarih', 'Tür', 'Ödeme', 'Kategori', 'Açıklama', 'Tutar', ''].map(h =>
              <th key={h} className="px-4 py-3 text-left font-medium text-gray-600 text-xs">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">Kayıt bulunamadı</td></tr>}
            {items.map(f => (
              <tr key={f.id} className={`hover:bg-gray-50 ${f.flow_type === 'income' ? 'border-l-2 border-l-green-400' : 'border-l-2 border-l-red-400'}`}>
                <td className="px-4 py-2">{new Date(f.flow_date).toLocaleDateString('tr-TR')}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${f.flow_type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {f.flow_type === 'income' ? 'Gelir' : 'Gider'}
                  </span>
                </td>
                <td className="px-4 py-2">
                  {f.pay_method && <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PAY_COLORS[f.pay_method] || 'bg-gray-100 text-gray-600'}`}>{PAY_LABELS[f.pay_method] || f.pay_method}</span>}
                </td>
                <td className="px-4 py-2 text-gray-500 text-xs">{f.category || '-'}</td>
                <td className="px-4 py-2 text-gray-600">{f.description || '-'}</td>
                <td className={`px-4 py-2 font-bold ${f.flow_type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                  {f.flow_type === 'income' ? '+' : '-'}₺{f.amount?.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-2">
                  <div className="flex gap-1">
                    <button onClick={() => { setEditItem(f); setForm({ flow_date: f.flow_date, flow_type: f.flow_type, pay_method: f.pay_method || 'cash', amount: f.amount, description: f.description || '', category: f.category || '' }); setModal('edit') }}
                      className="text-gray-400 hover:text-gray-600 p-1"><Edit2 size={13} /></button>
                    <button onClick={() => handleDelete(f.id)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {(modal === 'create' || modal === 'edit') && (
        <Modal title={modal === 'create' ? 'Yeni Kasa Kaydı' : 'Kaydı Düzenle'} onClose={() => setModal(null)}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Tarih *</label>
                <input type="date" className="w-full border rounded-lg px-3 py-2 text-sm" value={form.flow_date}
                  onChange={e => setForm(f => ({ ...f, flow_date: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tür *</label>
                <div className="flex gap-2">
                  <button onClick={() => setForm(f => ({ ...f, flow_type: 'income' }))}
                    className={`flex-1 py-2 rounded-lg text-sm border font-medium ${form.flow_type === 'income' ? 'bg-green-600 text-white border-green-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                    Gelir
                  </button>
                  <button onClick={() => setForm(f => ({ ...f, flow_type: 'expense' }))}
                    className={`flex-1 py-2 rounded-lg text-sm border font-medium ${form.flow_type === 'expense' ? 'bg-red-600 text-white border-red-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                    Gider
                  </button>
                </div>
              </div>
            </div>
            {form.flow_type === 'income' && (
              <div>
                <label className="block text-sm font-medium mb-1">Ödeme Yöntemi</label>
                <div className="flex gap-2">
                  {[['cash','Nakit'],['pos','POS/Kart'],['elden','Elden'],['other','Diğer']].map(([v,l]) => (
                    <button key={v} onClick={() => setForm(f => ({ ...f, pay_method: v }))}
                      className={`flex-1 py-1.5 rounded-lg text-xs border ${form.pay_method === v ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1">Tutar (₺) *</label>
              <input type="number" className="w-full border rounded-lg px-3 py-2 text-sm" value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Kategori</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Satış, Kira, Fatura, vb."
                value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Açıklama</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleSave} className={`flex-1 text-white py-2 rounded-lg text-sm ${form.flow_type === 'income' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
              Kaydet
            </button>
            <button onClick={() => setModal(null)} className="flex-1 border py-2 rounded-lg text-sm">İptal</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
