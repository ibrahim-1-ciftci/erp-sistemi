import { useEffect, useState } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'
import Modal from '../components/Modal'
import { Plus, Trash2, Eye, Edit2 } from 'lucide-react'

const emptyForm = { product_id: '', notes: '', items: [] }

export default function BOMPage() {
  const [boms, setBoms] = useState([])
  const [products, setProducts] = useState([])
  const [materials, setMaterials] = useState([])
  const [modal, setModal] = useState(null) // null | 'create' | 'edit' | 'view'
  const [viewBom, setViewBom] = useState(null)
  const [editBom, setEditBom] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const load = () => api.get('/bom', { params: { limit: 100 } }).then(r => setBoms(r.data.items))

  useEffect(() => {
    load()
    api.get('/products', { params: { limit: 100 } }).then(r => setProducts(r.data.items))
    api.get('/raw-materials', { params: { limit: 200 } }).then(r => setMaterials(r.data.items))
  }, [])

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { raw_material_id: '', quantity_required: 1 }] }))
  const removeItem = i => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }))
  const updateItem = (i, key, val) => setForm(f => {
    const items = [...f.items]; items[i] = { ...items[i], [key]: val }; return { ...f, items }
  })

  const openEdit = (b) => {
    setEditBom(b)
    setForm({
      product_id: b.product_id,
      notes: b.notes || '',
      items: b.items.map(item => ({
        raw_material_id: String(item.raw_material_id),
        quantity_required: item.quantity_required
      }))
    })
    setModal('edit')
  }

  const handleCreate = async () => {
    if (!form.product_id || form.items.length === 0) return toast.error('Ürün ve en az bir malzeme seçin')
    try {
      await api.post('/bom', {
        ...form,
        product_id: Number(form.product_id),
        items: form.items.map(i => ({ raw_material_id: Number(i.raw_material_id), quantity_required: Number(i.quantity_required) }))
      })
      toast.success('Reçete oluşturuldu'); setModal(null); load()
    } catch (e) { toast.error(e.response?.data?.detail || 'Hata') }
  }

  const handleEdit = async () => {
    if (form.items.length === 0) return toast.error('En az bir malzeme gerekli')
    try {
      await api.put(`/bom/${editBom.id}`, {
        notes: form.notes,
        items: form.items.map(i => ({ raw_material_id: Number(i.raw_material_id), quantity_required: Number(i.quantity_required) }))
      })
      toast.success('Reçete güncellendi'); setModal(null); load()
    } catch (e) { toast.error(e.response?.data?.detail || 'Hata') }
  }

  const handleDelete = async id => {
    if (!confirm('Silmek istediğinize emin misiniz?')) return
    try { await api.delete(`/bom/${id}`); toast.success('Silindi'); load() } catch { toast.error('Hata') }
  }

  const grouped = boms.reduce((acc, b) => {
    if (!acc[b.product_id]) acc[b.product_id] = { name: b.product_name, versions: [] }
    acc[b.product_id].versions.push(b)
    return acc
  }, {})

  const FormBody = (
    <div className="space-y-3">
      {modal === 'create' && (
        <div>
          <label className="block text-sm font-medium mb-1">Ürün</label>
          <select className="w-full border rounded-lg px-3 py-2 text-sm" value={form.product_id} onChange={e => setForm({...form, product_id: e.target.value})}>
            <option value="">Seçiniz</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      )}
      <div>
        <label className="block text-sm font-medium mb-1">Notlar</label>
        <input className="w-full border rounded-lg px-3 py-2 text-sm" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium">Malzemeler</label>
          <button onClick={addItem} className="text-xs text-blue-600 hover:underline flex items-center gap-1"><Plus size={12} /> Ekle</button>
        </div>
        {form.items.map((item, i) => (
          <div key={i} className="flex gap-2 mb-2">
            <select className="flex-1 border rounded-lg px-2 py-1.5 text-sm" value={item.raw_material_id} onChange={e => updateItem(i, 'raw_material_id', e.target.value)}>
              <option value="">Malzeme seç</option>
              {materials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>)}
            </select>
            <input type="number" placeholder="Miktar" className="w-24 border rounded-lg px-2 py-1.5 text-sm" value={item.quantity_required} onChange={e => updateItem(i, 'quantity_required', e.target.value)} />
            <button onClick={() => removeItem(i)} className="text-red-500"><Trash2 size={14} /></button>
          </div>
        ))}
        {form.items.length === 0 && <p className="text-xs text-gray-400">Henüz malzeme eklenmedi</p>}
      </div>
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Reçeteler (BOM)</h1>
        <button onClick={() => { setForm(emptyForm); setModal('create') }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
          <Plus size={16} /> Yeni Reçete
        </button>
      </div>

      <div className="space-y-4">
        {Object.entries(grouped).map(([pid, { name, versions }]) => (
          <div key={pid} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h3 className="font-semibold text-gray-800 mb-3">{name}</h3>
            <div className="space-y-2">
              {versions.map(b => (
                <div key={b.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <span className="text-sm font-medium">Versiyon {b.version}</span>
                    <span className="text-xs text-gray-400 ml-3">{b.items.length} malzeme · ₺{b.total_cost?.toFixed(2)} maliyet</span>
                    {b.notes && <span className="text-xs text-gray-400 ml-3 italic">{b.notes}</span>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setViewBom(b)} className="text-blue-600 hover:text-blue-800 p-1" title="Görüntüle"><Eye size={15} /></button>
                    <button onClick={() => openEdit(b)} className="text-gray-500 hover:text-gray-700 p-1" title="Düzenle"><Edit2 size={15} /></button>
                    <button onClick={() => handleDelete(b.id)} className="text-red-500 hover:text-red-700 p-1" title="Sil"><Trash2 size={15} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {boms.length === 0 && <div className="text-center py-12 text-gray-400">Henüz reçete oluşturulmamış</div>}
      </div>

      {/* Yeni Reçete */}
      {modal === 'create' && (
        <Modal title="Yeni Reçete" onClose={() => setModal(null)}>
          {FormBody}
          <div className="flex gap-2 mt-4">
            <button onClick={handleCreate} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 text-sm">Kaydet</button>
            <button onClick={() => setModal(null)} className="flex-1 border py-2 rounded-lg text-sm">İptal</button>
          </div>
        </Modal>
      )}

      {/* Reçete Düzenle */}
      {modal === 'edit' && editBom && (
        <Modal title={`Düzenle: ${editBom.product_name} - Versiyon ${editBom.version}`} onClose={() => setModal(null)}>
          {FormBody}
          <div className="flex gap-2 mt-4">
            <button onClick={handleEdit} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 text-sm">Güncelle</button>
            <button onClick={() => setModal(null)} className="flex-1 border py-2 rounded-lg text-sm">İptal</button>
          </div>
        </Modal>
      )}

      {/* Reçete Görüntüle */}
      {viewBom && (
        <Modal title={`${viewBom.product_name} - Versiyon ${viewBom.version}`} onClose={() => setViewBom(null)}>
          {viewBom.notes && <p className="text-sm text-gray-500 mb-3 italic">{viewBom.notes}</p>}
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Malzeme</th>
                <th className="text-right py-2">Miktar</th>
                <th className="text-right py-2">Birim Fiyat</th>
                <th className="text-right py-2">Toplam</th>
              </tr>
            </thead>
            <tbody>
              {viewBom.items.map(item => (
                <tr key={item.id} className="border-b">
                  <td className="py-2">{item.raw_material_name}</td>
                  <td className="text-right">{item.quantity_required} {item.raw_material_unit}</td>
                  <td className="text-right">₺{item.purchase_price}</td>
                  <td className="text-right">₺{item.line_cost?.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} className="pt-3 font-semibold">Toplam Maliyet</td>
                <td className="text-right pt-3 font-bold text-blue-600">₺{viewBom.total_cost?.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </Modal>
      )}
    </div>
  )
}
