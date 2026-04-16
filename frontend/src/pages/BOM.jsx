import { useEffect, useState, useRef, useCallback } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'
import Modal from '../components/Modal'
import { Plus, Trash2, Eye, Edit2, Search, ChevronUp, ChevronDown } from 'lucide-react'

const emptyForm = { product_id: '', notes: '', items: [] }

// Aranabilir malzeme seçici — dışarıda tanımlı, stabil referans
function MaterialSelect({ value, onChange, materials }) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const selected = materials.find(m => String(m.id) === String(value))
  const filtered = materials.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative flex-1" ref={ref}>
      <button type="button"
        onClick={() => { setOpen(o => !o); setSearch('') }}
        className="w-full border rounded-lg px-2 py-1.5 text-sm text-left flex items-center justify-between bg-white">
        <span className={selected ? 'text-gray-800' : 'text-gray-400'}>
          {selected ? `${selected.name} (${selected.unit})` : 'Malzeme seç'}
        </span>
        <Search size={12} className="text-gray-400 shrink-0" />
      </button>
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg">
          <div className="p-2 border-b">
            <input autoFocus placeholder="Ara..." className="w-full text-sm px-2 py-1 border rounded"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <ul className="max-h-48 overflow-y-auto">
            {filtered.length === 0 && <li className="px-3 py-2 text-xs text-gray-400">Sonuç yok</li>}
            {filtered.map(m => (
              <li key={m.id}
                onClick={() => { onChange(String(m.id)); setOpen(false) }}
                className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${String(m.id) === String(value) ? 'bg-blue-100 font-medium' : ''}`}>
                {m.name} <span className="text-gray-400 text-xs">({m.unit})</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// Modal dışarıda tanımlı — re-mount sorunu yok
function BomFormModal({ title, modal, form, setForm, materials, products, onSave, onClose }) {
  const addItem = () => setForm(f => ({
    ...f,
    items: [...f.items, { raw_material_id: '', quantity_required: '', order: f.items.length }]
  }))

  const removeItem = i => setForm(f => {
    const items = f.items.filter((_, idx) => idx !== i).map((it, idx) => ({ ...it, order: idx }))
    return { ...f, items }
  })

  const updateItem = useCallback((i, key, val) => {
    setForm(f => {
      const items = [...f.items]
      items[i] = { ...items[i], [key]: val }
      return { ...f, items }
    })
  }, [setForm])

  const moveItem = (i, dir) => {
    setForm(f => {
      const items = [...f.items]
      const j = i + dir
      if (j < 0 || j >= items.length) return f
      ;[items[i], items[j]] = [items[j], items[i]]
      return { ...f, items: items.map((it, idx) => ({ ...it, order: idx })) }
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="rounded-xl shadow-xl w-full max-w-3xl max-h-[92vh] flex flex-col"
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border)' }}>
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{title}</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Malzemeleri ve miktarlarını girin</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        <div className="overflow-y-auto flex-1 p-5">
          <div className="grid grid-cols-2 gap-6">
            {/* Sol — Ürün & Notlar */}
            <div className="space-y-4">
              {modal === 'create' && (
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Ürün *</label>
                  <select className="w-full border rounded-lg px-3 py-2 text-sm"
                    style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                    value={form.product_id} onChange={e => setForm(f => ({ ...f, product_id: e.target.value }))}>
                    <option value="">Seçiniz</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Notlar</label>
                <textarea rows={3} className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
                  style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                  value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Reçete hakkında notlar..." />
              </div>

              {/* Maliyet özeti */}
              {form.items.length > 0 && (
                <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-table-head)', border: '1px solid var(--border)' }}>
                  <p className="text-xs font-semibold mb-3 uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>Maliyet Özeti</p>
                  <div className="space-y-1.5">
                    {form.items.filter(i => i.raw_material_id).map((item, i) => {
                      const mat = materials.find(m => String(m.id) === String(item.raw_material_id))
                      if (!mat) return null
                      const cost = (mat.purchase_price || 0) * (Number(item.quantity_required) || 0)
                      return (
                        <div key={i} className="flex justify-between text-xs">
                          <span style={{ color: 'var(--text-secondary)' }}>{mat.name} × {item.quantity_required} {mat.unit}</span>
                          <span className="font-medium" style={{ color: 'var(--text-primary)' }}>₺{cost.toFixed(2)}</span>
                        </div>
                      )
                    })}
                    <div className="border-t pt-1.5 mt-1.5 flex justify-between text-sm font-bold" style={{ borderColor: 'var(--border)' }}>
                      <span style={{ color: 'var(--text-primary)' }}>Toplam Maliyet</span>
                      <span style={{ color: 'var(--accent)' }}>
                        ₺{form.items.filter(i => i.raw_material_id).reduce((s, item) => {
                          const mat = materials.find(m => String(m.id) === String(item.raw_material_id))
                          return s + (mat?.purchase_price || 0) * (Number(item.quantity_required) || 0)
                        }, 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sağ — Malzeme listesi */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                  Malzemeler ({form.items.length})
                </h3>
                <button onClick={addItem} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg"
                  style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-text)' }}>
                  <Plus size={12} /> Malzeme Ekle
                </button>
              </div>

              {form.items.length === 0 && (
                <div className="rounded-lg p-6 text-center border-2 border-dashed" style={{ borderColor: 'var(--border)' }}>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Henüz malzeme eklenmedi</p>
                  <button onClick={addItem} className="mt-2 text-xs" style={{ color: 'var(--accent)' }}>+ İlk malzemeyi ekle</button>
                </div>
              )}

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {form.items.map((item, i) => {
                  const mat = materials.find(m => String(m.id) === String(item.raw_material_id))
                  return (
                    <div key={i} className="rounded-lg p-3 border" style={{ backgroundColor: 'var(--bg-table-head)', borderColor: 'var(--border)' }}>
                      {/* Sıra no + sıralama butonları */}
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex flex-col shrink-0">
                          <button type="button" onClick={() => moveItem(i, -1)} disabled={i === 0}
                            className="text-gray-400 hover:text-gray-600 disabled:opacity-20 leading-none">
                            <ChevronUp size={13} />
                          </button>
                          <span className="text-xs font-bold text-center w-5 leading-none py-0.5"
                            style={{ color: 'var(--accent)' }}>{i + 1}</span>
                          <button type="button" onClick={() => moveItem(i, 1)} disabled={i === form.items.length - 1}
                            className="text-gray-400 hover:text-gray-600 disabled:opacity-20 leading-none">
                            <ChevronDown size={13} />
                          </button>
                        </div>
                        <div className="flex-1">
                          <MaterialSelect
                            value={item.raw_material_id}
                            onChange={val => updateItem(i, 'raw_material_id', val)}
                            materials={materials}
                          />
                        </div>
                        <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600 p-1 shrink-0">
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        <div>
                          <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Miktar</label>
                          <input
                            type="number"
                            min="0"
                            step="0.001"
                            className="w-full border rounded px-2 py-1.5 text-sm"
                            style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                            value={item.quantity_required}
                            onChange={e => updateItem(i, 'quantity_required', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Birim</label>
                          <div className="border rounded px-2 py-1.5 text-sm"
                            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                            {mat?.unit || '-'}
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Maliyet</label>
                          <div className="border rounded px-2 py-1.5 text-sm font-medium"
                            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--accent)' }}>
                            ₺{((mat?.purchase_price || 0) * (Number(item.quantity_required) || 0)).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 p-5 border-t" style={{ borderColor: 'var(--border)' }}>
          <button onClick={onSave} className="flex-1 py-2.5 rounded-lg text-sm font-semibold"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-text)' }}>
            {modal === 'create' ? 'Reçete Oluştur' : 'Güncelle'}
          </button>
          <button onClick={onClose} className="px-6 py-2.5 rounded-lg text-sm border"
            style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
            İptal
          </button>
        </div>
      </div>
    </div>
  )
}

export default function BOMPage() {
  const [boms, setBoms] = useState([])
  const [products, setProducts] = useState([])
  const [materials, setMaterials] = useState([])
  const [modal, setModal] = useState(null) // null | 'create' | 'edit'
  const [viewBom, setViewBom] = useState(null)
  const [editBom, setEditBom] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const load = () => api.get('/bom', { params: { limit: 100 } }).then(r => setBoms(r.data.items))

  useEffect(() => {
    load()
    api.get('/products', { params: { limit: 200 } }).then(r => setProducts(r.data.items))
    api.get('/raw-materials', { params: { limit: 500 } }).then(r => {
      const sorted = [...r.data.items].sort((a, b) => a.name.localeCompare(b.name, 'tr'))
      setMaterials(sorted)
    })
  }, [])

  const openEdit = (b) => {
    setEditBom(b)
    setForm({
      product_id: b.product_id,
      notes: b.notes || '',
      items: b.items.map((item, idx) => ({
        raw_material_id: String(item.raw_material_id),
        quantity_required: item.quantity_required,
        order: item.order ?? idx
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
        items: form.items.map((i, idx) => ({
          raw_material_id: Number(i.raw_material_id),
          quantity_required: Number(i.quantity_required),
          order: idx
        }))
      })
      toast.success('Reçete oluşturuldu'); setModal(null); load()
    } catch (e) { toast.error(e.response?.data?.detail || 'Hata') }
  }

  const handleEdit = async () => {
    if (form.items.length === 0) return toast.error('En az bir malzeme gerekli')
    try {
      await api.put(`/bom/${editBom.id}`, {
        notes: form.notes,
        items: form.items.map((i, idx) => ({
          raw_material_id: Number(i.raw_material_id),
          quantity_required: Number(i.quantity_required),
          order: idx
        }))
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

      {/* Yeni / Düzenle Reçete */}
      {(modal === 'create' || modal === 'edit') && (
        <BomFormModal
          title={modal === 'create' ? 'Yeni Reçete' : `Düzenle: ${editBom?.product_name} - Versiyon ${editBom?.version}`}
          modal={modal}
          form={form}
          setForm={setForm}
          materials={materials}
          products={products}
          onSave={modal === 'create' ? handleCreate : handleEdit}
          onClose={() => setModal(null)}
        />
      )}

      {/* Reçete Görüntüle */}
      {viewBom && (
        <Modal title={`${viewBom.product_name} - Versiyon ${viewBom.version}`} onClose={() => setViewBom(null)}>
          {viewBom.notes && <p className="text-sm text-gray-500 mb-3 italic">{viewBom.notes}</p>}
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 w-8">#</th>
                <th className="text-left py-2">Malzeme</th>
                <th className="text-right py-2">Miktar</th>
                <th className="text-right py-2">Birim Fiyat</th>
                <th className="text-right py-2">Toplam</th>
              </tr>
            </thead>
            <tbody>
              {viewBom.items.map((item, idx) => (
                <tr key={item.id} className="border-b">
                  <td className="py-2 text-gray-400 text-xs">{idx + 1}</td>
                  <td className="py-2">{item.raw_material_name}</td>
                  <td className="text-right">{item.quantity_required} {item.raw_material_unit}</td>
                  <td className="text-right">₺{item.purchase_price}</td>
                  <td className="text-right">₺{item.line_cost?.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4} className="pt-3 font-semibold">Toplam Maliyet</td>
                <td className="text-right pt-3 font-bold text-blue-600">₺{viewBom.total_cost?.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </Modal>
      )}
    </div>
  )
}
