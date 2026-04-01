import { useEffect, useState } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'
import Table from '../components/Table'
import Modal from '../components/Modal'
import { Plus, AlertTriangle, CheckCircle, Play, Trash2 } from 'lucide-react'

export default function Production() {
  const [productions, setProductions] = useState([])
  const [products, setProducts] = useState([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ product_id: '', quantity: 1 })
  const [preview, setPreview] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  const load = () => api.get('/production', { params: { limit: 50 } }).then(r => setProductions(r.data.items))

  useEffect(() => { load(); api.get('/products', { params: { limit: 100 } }).then(r => setProducts(r.data.items)) }, [])

  const loadPreview = async () => {
    if (!form.product_id || !form.quantity) return
    setPreviewLoading(true)
    try {
      const { data } = await api.get('/production/preview', { params: { product_id: form.product_id, quantity: form.quantity } })
      setPreview(data)
    } catch (e) { toast.error('Önizleme yüklenemedi') }
    finally { setPreviewLoading(false) }
  }

  useEffect(() => { if (form.product_id && form.quantity > 0) loadPreview() }, [form.product_id, form.quantity])

  const handleProduce = async () => {
    if (!preview?.can_produce) return toast.error('Yetersiz stok')
    try {
      await api.post('/production', { product_id: Number(form.product_id), quantity: Number(form.quantity), order_id: form.order_id ? Number(form.order_id) : undefined })
      toast.success('Üretim tamamlandı')
      setModal(false); setPreview(null); load()
    } catch (e) {
      const detail = e.response?.data?.detail
      if (detail?.missing_materials) {
        toast.error(`Yetersiz stok: ${detail.missing_materials.map(m => m.name).join(', ')}`)
      } else {
        toast.error(detail || 'Hata')
      }
    }
  }

  const handleComplete = async (id, product_id, quantity) => {
    try {
      await api.post('/production', { product_id, quantity })
      await api.delete(`/production/${id}`)
      toast.success('Üretim tamamlandı, stok güncellendi')
      load()
    } catch (e) {
      const detail = e.response?.data?.detail
      if (detail?.missing_materials) {
        toast.error(`Yetersiz stok: ${detail.missing_materials.map(m => m.name).join(', ')}`)
      } else {
        toast.error(detail || 'Hata')
      }
    }
  }

  const handleDelete = async id => {
    if (!confirm('Bu üretim kaydını silmek istediğinize emin misiniz?')) return
    try {
      await api.delete(`/production/${id}`)
      toast.success('Kayıt silindi')
      load()
    } catch (e) { toast.error(e.response?.data?.detail || 'Hata') }
  }

  const statusBadge = s => {
    const map = { completed: 'bg-green-100 text-green-700', planned: 'bg-yellow-100 text-yellow-700', in_progress: 'bg-blue-100 text-blue-700', failed: 'bg-red-100 text-red-700' }
    const labels = { completed: 'Tamamlandı', planned: 'Planlandı', in_progress: 'Devam Ediyor', failed: 'Başarısız' }
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[s]}`}>{labels[s]}</span>
  }

  const columns = [
    { key: 'product_name', label: 'Ürün' },
    { key: 'quantity', label: 'Miktar' },
    { key: 'total_cost', label: 'Maliyet', render: r => `₺${r.total_cost?.toFixed(2)}` },
    { key: 'status', label: 'Durum', render: r => statusBadge(r.status) },
    { key: 'notes', label: 'Sipariş', render: r => r.notes ? <span className="text-xs text-gray-500">{r.notes}</span> : '-' },
    { key: 'created_at', label: 'Tarih', render: r => new Date(r.created_at).toLocaleString('tr-TR') },
    { key: 'actions', label: '', render: r => (
      <div className="flex gap-1">
        {r.status === 'planned' && (
          <button onClick={() => handleComplete(r.id, r.product_id, r.quantity)}
            className="flex items-center gap-1 text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700">
            <Play size={11} /> Üret
          </button>
        )}
        <button onClick={() => handleDelete(r.id)} className="text-red-400 hover:text-red-600 p-1" title="Sil">
          <Trash2 size={14} />
        </button>
      </div>
    )}
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Üretim</h1>
        <button onClick={() => { setForm({ product_id: '', quantity: 1 }); setPreview(null); setModal(true) }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
          <Plus size={16} /> Yeni Üretim
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <Table columns={columns} data={productions} />
      </div>

      {modal && (
        <Modal title="Üretim Başlat" onClose={() => setModal(false)}>
          <div className="space-y-3 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Ürün</label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm" value={form.product_id} onChange={e => setForm({...form, product_id: e.target.value})}>
                <option value="">Seçiniz</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Adet</label>
              <input type="number" min="1" className="w-full border rounded-lg px-3 py-2 text-sm" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} />
            </div>
          </div>

          {previewLoading && <p className="text-sm text-gray-400 text-center py-4">Hesaplanıyor...</p>}

          {preview && !previewLoading && (
            <div className={`rounded-lg p-4 mb-4 ${preview.can_produce ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-center gap-2 mb-3">
                {preview.can_produce
                  ? <CheckCircle size={16} className="text-green-600" />
                  : <AlertTriangle size={16} className="text-red-600" />}
                <span className={`text-sm font-medium ${preview.can_produce ? 'text-green-700' : 'text-red-700'}`}>
                  {preview.can_produce ? 'Üretim yapılabilir' : 'Yetersiz stok'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                <div><span className="text-gray-500">Toplam Maliyet:</span> <strong>₺{preview.total_cost?.toFixed(2)}</strong></div>
                <div><span className="text-gray-500">Birim Maliyet:</span> <strong>₺{preview.unit_cost?.toFixed(2)}</strong></div>
                <div><span className="text-gray-500">Satış Fiyatı:</span> <strong>₺{preview.sale_price}</strong></div>
                <div><span className="text-gray-500">Tahmini Kâr:</span> <strong className={preview.total_profit >= 0 ? 'text-green-600' : 'text-red-600'}>₺{preview.total_profit?.toFixed(2)}</strong></div>
              </div>
              {preview.missing_materials?.length > 0 && (
                <div className="text-xs text-red-600">
                  <strong>Eksik:</strong> {preview.missing_materials.map(m => `${m.name} (${m.shortage} ${m.unit || ''} eksik)`).join(', ')}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={handleProduce} disabled={!preview?.can_produce}
              className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-40 text-sm font-medium">
              Üret
            </button>
            <button onClick={() => setModal(false)} className="flex-1 border py-2 rounded-lg text-sm">İptal</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
