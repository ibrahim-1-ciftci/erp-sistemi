import { useEffect, useState } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'
import Modal from '../components/Modal'
import Table from '../components/Table'
import { Plus, PackageCheck, Lightbulb, Trash2, ShoppingBag } from 'lucide-react'

const STATUS = {
  pending:   { label: 'Bekliyor',     cls: 'bg-yellow-100 text-yellow-700' },
  received:  { label: 'Teslim Alındı',cls: 'bg-green-100 text-green-700' },
  cancelled: { label: 'İptal',        cls: 'bg-red-100 text-red-700' },
}
const emptyForm = { material_id: '', supplier_id: '', quantity: '', unit_price: '', expected_date: '', notes: '' }

export default function Purchases() {
  const [items, setItems]           = useState([])
  const [pendingCost, setPending]   = useState(0)
  const [materials, setMaterials]   = useState([])
  const [suppliers, setSuppliers]   = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [filter, setFilter]         = useState('')
  const [modal, setModal]           = useState(null)
  const [form, setForm]             = useState(emptyForm)

  const load = () =>
    api.get('/purchases', { params: { status: filter || undefined } })
      .then(r => { setItems(r.data.items); setPending(r.data.total_pending_cost) })

  const loadSuggestions = () =>
    api.get('/purchases/suggestions').then(r => setSuggestions(r.data))

  useEffect(() => { load() }, [filter])
  useEffect(() => {
    api.get('/raw-materials', { params: { limit: 200 } }).then(r => setMaterials(r.data.items))
    api.get('/suppliers', { params: { limit: 100 } }).then(r => setSuppliers(r.data.items))
    loadSuggestions()
  }, [])

  const handleSave = async () => {
    if (!form.material_id || !form.quantity || !form.unit_price) return toast.error('Hammadde, miktar ve birim fiyat zorunlu')
    try {
      await api.post('/purchases', { ...form, material_id: Number(form.material_id), supplier_id: form.supplier_id ? Number(form.supplier_id) : null, quantity: Number(form.quantity), unit_price: Number(form.unit_price) })
      toast.success('Satın alma siparişi oluşturuldu'); setModal(null); load(); loadSuggestions()
    } catch (e) { toast.error(e.response?.data?.detail || 'Hata') }
  }

  const handleReceive = async id => {
    if (!confirm('Malzeme teslim alındı olarak işaretlensin mi? Stok otomatik güncellenecek.')) return
    try { await api.post(`/purchases/${id}/receive`); toast.success('Teslim alındı, stok güncellendi'); load(); loadSuggestions() }
    catch (e) { toast.error(e.response?.data?.detail || 'Hata') }
  }

  const handleDelete = async id => {
    if (!confirm('Silmek istediğinize emin misiniz?')) return
    try { await api.delete(`/purchases/${id}`); toast.success('Silindi'); load() }
    catch (e) { toast.error(e.response?.data?.detail || 'Hata') }
  }

  const fromSuggestion = s => {
    setForm({ material_id: String(s.material_id), supplier_id: String(s.supplier_id || ''), quantity: String(s.suggested_quantity), unit_price: '', expected_date: '', notes: `Otomatik öneri - kritik stok` })
    setModal('create')
  }

  const columns = [
    { key: 'material_name', label: 'Hammadde', render: r => <span className="font-medium">{r.material_name}</span> },
    { key: 'supplier_name', label: 'Tedarikçi', render: r => r.supplier_name || '-' },
    { key: 'quantity', label: 'Miktar', render: r => `${r.quantity} ${r.material_unit || ''}` },
    { key: 'unit_price', label: 'Birim Fiyat', render: r => `₺${r.unit_price?.toFixed(2)}` },
    { key: 'total_cost', label: 'Toplam', render: r => <span className="font-medium">₺{r.total_cost?.toFixed(2)}</span> },
    { key: 'expected_date', label: 'Beklenen Tarih', render: r => r.expected_date ? new Date(r.expected_date).toLocaleDateString('tr-TR') : '-' },
    { key: 'status', label: 'Durum', render: r => { const s = STATUS[r.status] || STATUS.pending; return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>{s.label}</span> } },
    { key: 'actions', label: '', render: r => (
      <div className="flex gap-1">
        {r.status === 'pending' && (
          <button onClick={() => handleReceive(r.id)} className="flex items-center gap-1 text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700">
            <PackageCheck size={11} /> Teslim Al
          </button>
        )}
        {r.status === 'pending' && <button onClick={() => handleDelete(r.id)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={13} /></button>}
      </div>
    )}
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Satın Alma</h1>
        <button onClick={() => { setForm(emptyForm); setModal('create') }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
          <Plus size={16} /> Yeni Sipariş
        </button>
      </div>

      {/* Özet */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg"><ShoppingBag size={20} className="text-blue-600" /></div>
          <div><p className="text-xs text-gray-500">Bekleyen Sipariş Tutarı</p>
            <p className="text-xl font-bold">₺{pendingCost?.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</p></div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="p-2 bg-orange-50 rounded-lg"><Lightbulb size={20} className="text-orange-600" /></div>
          <div><p className="text-xs text-gray-500">Satın Alma Önerisi</p>
            <p className="text-xl font-bold text-orange-600">{suggestions.length} hammadde</p></div>
        </div>
      </div>

      {/* Öneriler */}
      {suggestions.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-orange-700 flex items-center gap-2 mb-3"><Lightbulb size={16} /> Kritik Stok — Satın Alma Önerileri</h3>
          <div className="space-y-2">
            {suggestions.map(s => (
              <div key={s.material_id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-orange-100">
                <div className="text-sm">
                  <span className="font-medium">{s.material_name}</span>
                  <span className="text-gray-500 ml-2">Mevcut: {s.current_stock} {s.unit} / Min: {s.min_stock} {s.unit}</span>
                  <span className="text-orange-600 ml-2 font-medium">Öneri: {s.suggested_quantity} {s.unit} (~₺{s.estimated_cost?.toFixed(0)})</span>
                </div>
                <button onClick={() => fromSuggestion(s)} className="text-xs bg-orange-600 text-white px-3 py-1 rounded hover:bg-orange-700 whitespace-nowrap">
                  Sipariş Ver
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filtre */}
      <div className="flex gap-2 mb-4">
        {[['', 'Tümü'], ['pending', 'Bekliyor'], ['received', 'Teslim Alındı']].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)}
            className={`px-3 py-1.5 rounded-lg text-sm border ${filter === v ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
            {l}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <Table columns={columns} data={items} emptyText="Satın alma kaydı bulunamadı" />
      </div>

      {modal === 'create' && (
        <Modal title="Yeni Satın Alma Siparişi" onClose={() => setModal(null)}>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Hammadde *</label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm" value={form.material_id}
                onChange={e => {
                  const m = materials.find(m => m.id === Number(e.target.value))
                  setForm(f => ({ ...f, material_id: e.target.value, supplier_id: String(m?.supplier_id || ''), unit_price: String(m?.purchase_price || '') }))
                }}>
                <option value="">Seçiniz</option>
                {materials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.unit}) — Stok: {m.stock_quantity}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tedarikçi</label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm" value={form.supplier_id}
                onChange={e => setForm(f => ({ ...f, supplier_id: e.target.value }))}>
                <option value="">Seçiniz</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Miktar *</label>
                <input type="number" className="w-full border rounded-lg px-3 py-2 text-sm" value={form.quantity}
                  onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Birim Fiyat (₺) *</label>
                <input type="number" className="w-full border rounded-lg px-3 py-2 text-sm" value={form.unit_price}
                  onChange={e => setForm(f => ({ ...f, unit_price: e.target.value }))} />
              </div>
            </div>
            {form.quantity && form.unit_price && (
              <div className="bg-blue-50 rounded-lg px-3 py-2 text-sm text-blue-700 font-medium">
                Toplam: ₺{(Number(form.quantity) * Number(form.unit_price)).toLocaleString('tr-TR', { maximumFractionDigits: 2 })}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1">Beklenen Teslim Tarihi</label>
              <input type="date" className="w-full border rounded-lg px-3 py-2 text-sm" value={form.expected_date}
                onChange={e => setForm(f => ({ ...f, expected_date: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Notlar</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm" value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleSave} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 text-sm">Kaydet</button>
            <button onClick={() => setModal(null)} className="flex-1 border py-2 rounded-lg text-sm">İptal</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
