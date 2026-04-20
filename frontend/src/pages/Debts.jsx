import { useEffect, useState } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'
import Modal from '../components/Modal'
import { Plus, Download, Trash2, Edit2, Banknote, AlertTriangle, Clock, ArchiveRestore, Eye, X, FileText } from 'lucide-react'

const STATUS = {
  pending: { label: 'Ödenmedi',  cls: 'bg-yellow-100 text-yellow-700' },
  overdue: { label: 'Gecikmiş',  cls: 'bg-red-100 text-red-700' },
  partial: { label: 'Kısmi',     cls: 'bg-blue-100 text-blue-700' },
  paid:    { label: 'Ödendi',    cls: 'bg-green-100 text-green-700' },
}
const emptyForm = { creditor: '', description: '', total_amount: '', due_date: '', notes: '', items: [{ description: '', amount: '' }] }
const today = new Date().toISOString().split('T')[0]

function Badge({ s }) {
  const st = STATUS[s] || STATUS.pending
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${st.cls}`}>{st.label}</span>
}

export default function Debts() {
  const [tab, setTab]           = useState('active')
  const [items, setItems]       = useState([])
  const [summary, setSummary]   = useState({ total_debt: 0, overdue_count: 0 })
  const [filter, setFilter]     = useState('')
  const [modal, setModal]       = useState(null)
  const [selected, setSelected] = useState(null)
  const [form, setForm]         = useState(emptyForm)
  const [payForm, setPayForm]   = useState({ amount: '', paid_date: today })
  const [detailDebt, setDetailDebt] = useState(null)
  const [editDebt, setEditDebt] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [checkedIds, setCheckedIds] = useState(new Set())

  const load = () => {
    const statusParam = tab === 'archive' ? 'paid' : (filter || undefined)
    api.get('/debts', { params: { status: statusParam } })
      .then(r => {
        let result = r.data.items
        if (tab === 'active' && !filter) result = result.filter(d => d.status !== 'paid')
        setItems(result)
        setSummary({ total_debt: r.data.total_debt, overdue_count: r.data.overdue_count })
        setCheckedIds(new Set())
      })
  }

  useEffect(() => { load() }, [filter, tab])

  const addItem    = () => setForm(f => ({ ...f, items: [...f.items, { description: '', amount: '' }] }))
  const removeItem = i  => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }))
  const updateItem = (i, key, val) => setForm(f => {
    const items = [...f.items]; items[i] = { ...items[i], [key]: val }; return { ...f, items }
  })
  const grandTotal = () => form.items.reduce((s, i) => s + (Number(i.amount) || 0), 0)

  const openCreate = () => { setForm(emptyForm); setModal('create') }
  const openEdit   = d  => {
    setSelected(d)
    setForm({
      creditor: d.creditor, description: d.description || '',
      total_amount: d.total_amount, due_date: d.due_date, notes: d.notes || '',
      items: d.items?.length > 0 ? d.items.map(i => ({ ...i })) : [{ description: '', amount: '' }]
    })
    setModal('edit')
  }
  const openPay    = d  => { setSelected(d); setPayForm({ amount: d.remaining, paid_date: today }); setModal('pay') }

  const handleSave = async () => {
    if (!form.creditor || !form.due_date) return toast.error('Alacaklı ve vade zorunlu')
    try {
      const total = grandTotal() || Number(form.total_amount) || 0
      const items_json = JSON.stringify(form.items.filter(i => i.description || i.amount))
      const payload = { ...form, total_amount: total, items_json }
      delete payload.items
      if (modal === 'create') await api.post('/debts', payload)
      else await api.put(`/debts/${selected.id}`, payload)
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

  const handleUnarchive = async d => {
    if (!confirm('Arşivden çıkarmak istediğinize emin misiniz?')) return
    try {
      await api.put(`/debts/${d.id}`, { paid_amount: 0, paid_date: null })
      toast.success('Geri alındı'); load()
    } catch { toast.error('Hata') }
  }

  const exportExcel = async () => {
    try {
      const token = localStorage.getItem('token')
      const statusParam = tab === 'archive' ? 'paid' : (filter || '')
      const p = statusParam ? `?status=${statusParam}` : ''
      const res = await fetch(`/api/debts/export${p}`, { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = 'borc_takibi.xlsx'; a.click()
      URL.revokeObjectURL(url)
    } catch { toast.error('Export başarısız') }
  }

  const toggleCheck = id => setCheckedIds(prev => {
    const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next
  })
  const toggleAll = () => {
    if (checkedIds.size === items.length) setCheckedIds(new Set())
    else setCheckedIds(new Set(items.map(d => d.id)))
  }

  const activeColumns = [
    { key: 'creditor',     label: 'Alacaklı',    render: r => <span className="font-medium">{r.creditor}</span> },
    { key: 'description',  label: 'Açıklama',    render: r => r.description || '-' },
    { key: 'items',        label: 'Kalemler',     render: r => r.items?.length > 0
      ? <span className="text-xs text-gray-500">{r.items.map(i => i.description).filter(Boolean).join(', ') || `${r.items.length} kalem`}</span>
      : <span className="text-gray-300 text-xs">-</span>
    },
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
        <button onClick={() => setDetailDebt(r)} className="text-blue-500 hover:text-blue-700 p-1"><Eye size={13}/></button>
        <button onClick={() => openPay(r)} className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 whitespace-nowrap">Öde</button>
        <button onClick={() => openEdit(r)} className="text-gray-500 hover:text-gray-700 p-1"><Edit2 size={13} /></button>
        <button onClick={() => handleDelete(r.id)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={13} /></button>
      </div>
    )}
  ]

  const archiveColumns = [
    { key: 'creditor',     label: 'Alacaklı',    render: r => <span className="font-medium">{r.creditor}</span> },
    { key: 'description',  label: 'Açıklama',    render: r => r.description || '-' },
    { key: 'total_amount', label: 'Toplam',       render: r => `₺${r.total_amount?.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}` },
    { key: 'paid_date',    label: 'Ödenme Tarihi', render: r => r.paid_date ? new Date(r.paid_date).toLocaleDateString('tr-TR') : '-' },
    { key: 'actions', label: '', render: r => (
      <div className="flex gap-1">
        <button onClick={() => setDetailDebt(r)} className="text-blue-500 hover:text-blue-700 p-1"><Eye size={13}/></button>
        <button onClick={() => handleUnarchive(r)} className="flex items-center gap-1 text-xs bg-orange-500 text-white px-2 py-1 rounded hover:bg-orange-600 whitespace-nowrap">
          <ArchiveRestore size={11} /> Geri Al
        </button>
        <button onClick={() => handleDelete(r.id)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={13} /></button>
      </div>
    )}
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Borç Takibi</h1>
        <div className="flex gap-2">
          <button onClick={exportExcel} className="flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 text-sm">
            <Download size={15} /> Excel
          </button>
          {tab === 'active' && (
            <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
              <Plus size={16} /> Yeni Borç
            </button>
          )}
        </div>
      </div>

      {/* Sekmeler */}
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1 w-fit">
        <button onClick={() => { setTab('active'); setFilter('') }}
          className={`px-5 py-2 rounded-md text-sm font-medium transition-all ${tab === 'active' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
          Aktif Borçlar
          {summary.overdue_count > 0 && tab === 'active' && (
            <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">{summary.overdue_count}</span>
          )}
        </button>
        <button onClick={() => { setTab('archive'); setFilter('') }}
          className={`px-5 py-2 rounded-md text-sm font-medium transition-all ${tab === 'archive' ? 'bg-white shadow text-green-600' : 'text-gray-500 hover:text-gray-700'}`}>
          Ödenen Arşivi
        </button>
      </div>

      {/* Özet kartlar */}
      {tab === 'active' && (
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
            <div><p className="text-xs text-gray-500">Aktif Kayıt</p>
              <p className="text-xl font-bold">{items.length}</p></div>
          </div>
        </div>
      )}

      {/* Filtre */}
      {tab === 'active' && (
        <div className="flex gap-2 mb-4">
          {[['', 'Tümü'], ['pending', 'Ödenmedi'], ['overdue', 'Gecikmiş'], ['partial', 'Kısmi']].map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v)}
              className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${filter === v ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
              {l}
            </button>
          ))}
        </div>
      )}

      {/* Tablo */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-3 py-3 w-8">
                <input type="checkbox" className="w-4 h-4 cursor-pointer accent-blue-600"
                  checked={items.length > 0 && checkedIds.size === items.length} onChange={toggleAll} />
              </th>
              {(tab === 'active' ? activeColumns : archiveColumns).map(c =>
                <th key={c.key} className="px-3 py-3 text-left font-medium text-gray-600 text-xs">{c.label}</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.length === 0 && (
              <tr><td colSpan={10} className="px-4 py-10 text-center text-gray-400">
                {tab === 'archive' ? 'Henüz ödenen borç yok' : 'Borç kaydı bulunamadı'}
              </td></tr>
            )}
            {items.map(r => (
              <tr key={r.id} className={`hover:bg-gray-50 ${checkedIds.has(r.id) ? 'bg-blue-50' : ''} ${r.status === 'overdue' ? 'bg-red-50' : ''}`}>
                <td className="px-3 py-3">
                  <input type="checkbox" className="w-4 h-4 cursor-pointer accent-blue-600"
                    checked={checkedIds.has(r.id)} onChange={() => toggleCheck(r.id)} />
                </td>
                {(tab === 'active' ? activeColumns : archiveColumns).map(c => (
                  <td key={c.key} className="px-3 py-3">{c.render ? c.render(r) : r[c.key]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Yeni / Düzenle Modalı */}
      {(modal === 'create' || modal === 'edit') && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold">{modal === 'create' ? 'Yeni Borç Kaydı' : 'Borç Düzenle'}</h2>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Alacaklı (Kime Borçluyuz) *</label>
                  <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Tedarikçi adı, banka vb."
                    value={form.creditor} onChange={e => setForm(f => ({ ...f, creditor: e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Açıklama</label>
                  <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Hammadde alımı, kredi taksiti vb."
                    value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
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

              {/* Kalem listesi */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold">Borç Kalemleri</label>
                  <button onClick={addItem} className="flex items-center gap-1 text-xs text-blue-600 hover:underline"><Plus size={12}/> Kalem Ekle</button>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-gray-600">Açıklama</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-600 w-32">Tutar (₺)</th>
                        <th className="w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {form.items.map((item, i) => (
                        <tr key={i}>
                          <td className="px-2 py-1.5">
                            <input className="w-full border rounded px-2 py-1 text-sm" value={item.description}
                              onChange={e => updateItem(i, 'description', e.target.value)} placeholder="Kalem açıklaması" />
                          </td>
                          <td className="px-2 py-1.5">
                            <input type="number" className="w-full border rounded px-2 py-1 text-sm" value={item.amount}
                              onChange={e => updateItem(i, 'amount', e.target.value)} />
                          </td>
                          <td className="px-2 py-1.5">
                            {form.items.length > 1 && (
                              <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600"><X size={14}/></button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50 border-t">
                        <td className="px-3 py-2 text-right font-semibold text-sm">Toplam:</td>
                        <td className="px-3 py-2 font-bold text-blue-600">₺{grandTotal().toLocaleString('tr-TR', { maximumFractionDigits: 2 })}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
            <div className="flex gap-2 p-4 border-t sticky bottom-0 bg-white">
              <button onClick={handleSave} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">Kaydet</button>
              <button onClick={() => setModal(null)} className="flex-1 border py-2 rounded-lg text-sm">İptal</button>
            </div>
          </div>
        </div>
      )}

      {/* Ödeme Yap Modalı */}
      {modal === 'pay' && selected && (
        <Modal title={`Ödeme Yap: ${selected.creditor}`} onClose={() => setModal(null)}>
          <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm space-y-1">
            <p><span className="text-gray-500">Açıklama:</span> {selected.description || '-'}</p>
            <p><span className="text-gray-500">Toplam Borç:</span> ₺{selected.total_amount?.toFixed(2)}</p>
            <p><span className="text-gray-500">Ödenen:</span> ₺{selected.paid_amount?.toFixed(2)}</p>
            <p className="font-medium"><span className="text-gray-500">Kalan:</span> ₺{selected.remaining?.toFixed(2)}</p>
          </div>
          {selected.items?.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-500 mb-2">KALEMLER</p>
              <div className="space-y-1">
                {selected.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-gray-600">{item.description}</span>
                    <span className="font-medium">₺{Number(item.amount).toLocaleString('tr-TR', { maximumFractionDigits: 2 })}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Ödenen Tutar (₺)</label>
              <input type="number" className="w-full border rounded-lg px-3 py-2 text-sm"
                value={payForm.amount} onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))} />
              <div className="flex gap-2 mt-1">
                <button type="button" onClick={() => setPayForm(f => ({ ...f, amount: selected.remaining }))}
                  className="text-xs text-blue-600 hover:underline">Tamamını öde (₺{selected.remaining?.toFixed(2)})</button>
              </div>
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

      {/* Detay Modalı */}
      {detailDebt && (
        <Modal title={`${detailDebt.creditor}`} onClose={() => setDetailDebt(null)}>
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div><p className="text-xs text-gray-400">Açıklama</p><p className="font-medium">{detailDebt.description || '-'}</p></div>
              <div><p className="text-xs text-gray-400">Durum</p><Badge s={detailDebt.status} /></div>
              <div><p className="text-xs text-gray-400">Toplam</p><p className="font-bold">₺{detailDebt.total_amount?.toFixed(2)}</p></div>
              <div><p className="text-xs text-gray-400">Ödenen</p><p className="font-medium text-green-600">₺{detailDebt.paid_amount?.toFixed(2)}</p></div>
              <div><p className="text-xs text-gray-400">Kalan</p><p className="font-bold text-red-600">₺{detailDebt.remaining?.toFixed(2)}</p></div>
              <div><p className="text-xs text-gray-400">Vade</p><p className={detailDebt.status === 'overdue' ? 'text-red-600 font-medium' : ''}>{new Date(detailDebt.due_date).toLocaleDateString('tr-TR')}</p></div>
            </div>
            {detailDebt.items?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2 uppercase">Kalemler</p>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-gray-600">Açıklama</th>
                        <th className="px-3 py-2 text-right font-medium text-gray-600">Tutar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {detailDebt.items.map((item, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2">{item.description}</td>
                          <td className="px-3 py-2 text-right">₺{Number(item.amount).toLocaleString('tr-TR', { maximumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {detailDebt.notes && <div><p className="text-xs text-gray-400">Notlar</p><p>{detailDebt.notes}</p></div>}
          </div>
          <div className="flex gap-2 mt-4">
            {detailDebt.status !== 'paid' && (
              <button onClick={() => { setDetailDebt(null); openPay(detailDebt) }}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm">Ödeme Yap</button>
            )}
            <button onClick={() => setDetailDebt(null)} className="flex-1 border py-2 rounded-lg text-sm">Kapat</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
