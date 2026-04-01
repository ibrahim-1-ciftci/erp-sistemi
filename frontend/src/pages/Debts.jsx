import { useEffect, useState } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'
import Modal from '../components/Modal'
import Table from '../components/Table'
import { Plus, Download, Trash2, Edit2, Banknote, AlertTriangle, CheckCircle, Clock } from 'lucide-react'

const STATUS = {
  pending: { label: 'Ödenmedi',  cls: 'bg-yellow-100 text-yellow-700' },
  overdue: { label: 'Gecikmiş',  cls: 'bg-red-100 text-red-700' },
  partial: { label: 'Kısmi',     cls: 'bg-blue-100 text-blue-700' },
  paid:    { label: 'Ödendi',    cls: 'bg-green-100 text-green-700' },
}
const emptyForm = { creditor: '', description: '', total_amount: '', due_date: '', notes: '' }
const today = new Date().toISOString().split('T')[0]

function Badge({ s }) {
  const st = STATUS[s] || STATUS.pending
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${st.cls}`}>{st.label}</span>
}

export default function Debts() {
  const [items, setItems]       = useState([])
  const [summary, setSummary]   = useState({ total_debt: 0, overdue_count: 0 })
  const [filter, setFilter]     = useState('')
  const [modal, setModal]       = useState(null)  // null | 'create' | 'edit' | 'pay'
  const [selected, setSelected] = useState(null)
  const [form, setForm]         = useState(emptyForm)
  const [payForm, setPayForm]   = useState({ amount: '', paid_date: today })

  const load = () =>
    api.get('/debts', { params: { status: filter || undefined } })
      .then(r => { setItems(r.data.items); setSummary({ total_debt: r.data.total_debt, overdue_count: r.data.overdue_count }) })

  useEffect(() => { load() }, [filter])

  const openCreate = () => { setForm(emptyForm); setModal('create') }
  const openEdit   = d  => { setSelected(d); setForm({ creditor: d.creditor, description: d.description || '', total_amount: d.total_amount, due_date: d.due_date, notes: d.notes || '' }); setModal('edit') }
  const openPay    = d  => { setSelected(d); setPayForm({ amount: d.remaining, paid_date: today }); setModal('pay') }

  const handleSave = async () => {
    if (!form.creditor || !form.total_amount || !form.due_date) return toast.error('Alacaklı, tutar ve vade zorunlu')
    try {
      if (modal === 'create') await api.post('/debts', { ...form, total_amount: Number(form.total_amount) })
      else await api.put(`/debts/${selected.id}`, { ...form, total_amount: Number(form.total_amount) })
      toast.success('Kaydedildi'); setModal(null); load()
    } catch (e) { toast.error(e.response?.data?.detail || 'Hata') }
  }

  const handlePay = async () => {
    if (!payForm.amount) return toast.error('Tutar girin')
    try {
      await api.post(`/debts/${selected.id}/pay`, { amount: Number(payForm.amount), paid_date: payForm.paid_date })
      toast.success('Ödeme kaydedildi'); setModal(null); load()
    } catch (e) { toast.error(e.response?.data?.detail || 'Hata') }
  }

  const handleDelete = async id => {
    if (!confirm('Silmek istediğinize emin misiniz?')) return
    try { await api.delete(`/debts/${id}`); toast.success('Silindi'); load() }
    catch { toast.error('Hata') }
  }

  const exportExcel = async () => {
    try {
      const token = localStorage.getItem('token')
      const p = filter ? `?status=${filter}` : ''
      const res = await fetch(`/api/debts/export${p}`, { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = 'borc_takibi.xlsx'; a.click()
      URL.revokeObjectURL(url)
    } catch { toast.error('Export başarısız') }
  }

  const columns = [
    { key: 'creditor',     label: 'Alacaklı',    render: r => <span className="font-medium">{r.creditor}</span> },
    { key: 'description',  label: 'Açıklama',    render: r => r.description || '-' },
    { key: 'total_amount', label: 'Toplam',       render: r => `₺${r.total_amount?.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}` },
    { key: 'paid_amount',  label: 'Ödenen',       render: r => <span className="text-green-600">₺{r.paid_amount?.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}</span> },
    { key: 'remaining',    label: 'Kalan',        render: r => <span className="font-medium">₺{r.remaining?.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}</span> },
    { key: 'due_date',     label: 'Vade',         render: r => (
      <div>
        <span className={r.status === 'overdue' ? 'text-red-600 font-medium' : ''}>{new Date(r.due_date).toLocaleDateString('tr-TR')}</span>
        {r.overdue_days > 0 && <span className="text-xs text-red-400 block">{r.overdue_days} gün geçti</span>}
      </div>
    )},
    { key: 'status', label: 'Durum', render: r => <Badge s={r.status} /> },
    { key: 'actions', label: '', render: r => (
      <div className="flex gap-1">
        {r.status !== 'paid' && (
          <button onClick={() => openPay(r)} className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 whitespace-nowrap">Ödeme Yap</button>
        )}
        <button onClick={() => openEdit(r)} className="text-gray-500 hover:text-gray-700 p-1"><Edit2 size={13} /></button>
        <button onClick={() => handleDelete(r.id)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={13} /></button>
      </div>
    )}
  ]

  return (
    <div>
      {/* Başlık */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Borç Takibi</h1>
        <div className="flex gap-2">
          <button onClick={exportExcel} className="flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 text-sm">
            <Download size={15} /> Excel
          </button>
          <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
            <Plus size={16} /> Yeni Borç
          </button>
        </div>
      </div>

      {/* Özet kartlar */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="p-2 bg-red-50 rounded-lg"><Banknote size={20} className="text-red-600" /></div>
          <div><p className="text-xs text-gray-500">Toplam Borç</p>
            <p className="text-xl font-bold text-red-600">₺{summary.total_debt?.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</p></div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="p-2 bg-orange-50 rounded-lg"><AlertTriangle size={20} className="text-orange-600" /></div>
          <div><p className="text-xs text-gray-500">Gecikmiş</p>
            <p className="text-xl font-bold text-orange-600">{summary.overdue_count} adet</p></div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg"><Clock size={20} className="text-blue-600" /></div>
          <div><p className="text-xs text-gray-500">Toplam Kayıt</p>
            <p className="text-xl font-bold">{items.length}</p></div>
        </div>
      </div>

      {/* Filtre */}
      <div className="flex gap-2 mb-4">
        {[['', 'Tümü'], ['pending', 'Ödenmedi'], ['overdue', 'Gecikmiş'], ['partial', 'Kısmi'], ['paid', 'Ödendi']].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)}
            className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${filter === v ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* Tablo */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <Table columns={columns} data={items} emptyText="Borç kaydı bulunamadı" />
      </div>

      {/* Yeni / Düzenle Modalı */}
      {(modal === 'create' || modal === 'edit') && (
        <Modal title={modal === 'create' ? 'Yeni Borç Kaydı' : 'Borç Düzenle'} onClose={() => setModal(null)}>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Alacaklı (Kime Borçluyuz) *</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Tedarikçi adı, banka vb."
                value={form.creditor} onChange={e => setForm(f => ({ ...f, creditor: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Açıklama</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Hammadde alımı, kredi taksiti vb."
                value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tutar (₺) *</label>
              <input type="number" className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.total_amount} onChange={e => setForm(f => ({ ...f, total_amount: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Vade Tarihi *</label>
              <input type="date" className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
              <div className="flex gap-2 mt-1">
                {[7, 15, 30, 60, 90].map(d => (
                  <button key={d} type="button" onClick={() => {
                    const dt = new Date(); dt.setDate(dt.getDate() + d)
                    setForm(f => ({ ...f, due_date: dt.toISOString().split('T')[0] }))
                  }} className="text-xs text-blue-600 hover:underline">+{d}g</button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Notlar</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleSave} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 text-sm">Kaydet</button>
            <button onClick={() => setModal(null)} className="flex-1 border py-2 rounded-lg text-sm">İptal</button>
          </div>
        </Modal>
      )}

      {/* Ödeme Yap Modalı */}
      {modal === 'pay' && selected && (
        <Modal title={`Ödeme Yap: ${selected.creditor}`} onClose={() => setModal(null)}>
          <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm space-y-1">
            <p><span className="text-gray-500">Açıklama:</span> {selected.description || '-'}</p>
            <p><span className="text-gray-500">Toplam Borç:</span> ₺{selected.total_amount?.toFixed(2)}</p>
            <p><span className="text-gray-500">Daha önce ödenen:</span> ₺{selected.paid_amount?.toFixed(2)}</p>
            <p className="font-medium"><span className="text-gray-500">Kalan:</span> ₺{selected.remaining?.toFixed(2)}</p>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Ödenen Tutar (₺)</label>
              <input type="number" className="w-full border rounded-lg px-3 py-2 text-sm"
                value={payForm.amount} onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Ödeme Tarihi</label>
              <input type="date" className="w-full border rounded-lg px-3 py-2 text-sm"
                value={payForm.paid_date} onChange={e => setPayForm(f => ({ ...f, paid_date: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handlePay} className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 text-sm">Ödemeyi Kaydet</button>
            <button onClick={() => setModal(null)} className="flex-1 border py-2 rounded-lg text-sm">İptal</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
