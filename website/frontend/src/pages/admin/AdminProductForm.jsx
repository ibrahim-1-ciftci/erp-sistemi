import React, { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Upload, X, Star, GripVertical, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../api/axios'
import RichEditor from '../../components/RichEditor'

const EMPTY = {
  name_tr: '', name_en: '',
  description_tr: '', description_en: '',
  details_tr: '', details_en: '',
  category_id: '', is_active: true, order: 0,
  price: '', price_discounted: '', discount_percent: '',
  price_unit: 'adet', min_order_qty: '1',
  show_price: true, price_note_tr: '', price_note_en: '',
}

export default function AdminProductForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [form, setForm] = useState(EMPTY)
  const [categories, setCategories] = useState([])
  const [existingImages, setExistingImages] = useState([])
  const [newFiles, setNewFiles] = useState([])
  const [newPreviews, setNewPreviews] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('tr')
  const [variants, setVariants] = useState([])
  const [variantForm, setVariantForm] = useState({ label: '', price: '', price_discounted: '', price_note_tr: '', image_id: '' })
  const [editingVariant, setEditingVariant] = useState(null) // düzenlenen varyant id
  const varDragIdx = useRef(null)
  const varDragOverIdx = useRef(null)

  const dragIdx = useRef(null)
  const dragOverIdx = useRef(null)

  useEffect(() => {
    api.get('/categories').then(r => setCategories(r.data)).catch(() => {})
    if (isEdit) {
      api.get(`/products/${id}`).then(r => {
        const p = r.data
        setForm({
          name_tr: p.name_tr, name_en: p.name_en,
          description_tr: p.description_tr || '', description_en: p.description_en || '',
          details_tr: p.details_tr || '', details_en: p.details_en || '',
          category_id: p.category_id || '', is_active: p.is_active, order: p.order,
          price: p.price || '', price_discounted: p.price_discounted || '',
          discount_percent: p.discount_percent || '',
          price_unit: p.price_unit || 'adet',
          min_order_qty: p.min_order_qty || '1',
          show_price: p.show_price !== false,
          price_note_tr: p.price_note_tr || '',
          price_note_en: p.price_note_en || '',
        })
        setExistingImages((p.images || []).map((img, i) => ({
          id: (p.image_ids || [])[i] ?? null,
          image: img
        })))
        api.get(`/products/${id}/variants`).then(vr => setVariants(vr.data)).catch(() => {})
      }).catch(() => navigate('/admin/products'))
    }
  }, [id])

  // Varyant ekle
  const addVariant = async () => {
    if (!variantForm.label || !variantForm.price) return toast.error('Etiket ve fiyat zorunlu')
    const newV = {
      label: variantForm.label,
      price: parseFloat(variantForm.price),
      price_discounted: variantForm.price_discounted ? parseFloat(variantForm.price_discounted) : null,
      price_note_tr: variantForm.price_note_tr || '',
      price_note_en: '',
      is_active: true,
      sort_order: variants.length,
      image_id: variantForm.image_id ? parseInt(variantForm.image_id) : null
    }
    if (isEdit) {
      if (editingVariant) {
        // Güncelle
        try {
          const res = await api.put(`/products/${id}/variants/${editingVariant}`, newV)
          setVariants(prev => prev.map(v => v.id === editingVariant ? res.data : v))
          toast.success('Varyant güncellendi')
          setEditingVariant(null)
        } catch { toast.error('Hata') }
      } else {
        try {
          const res = await api.post(`/products/${id}/variants`, newV)
          setVariants(prev => [...prev, res.data])
          toast.success('Varyant eklendi')
        } catch { toast.error('Hata') }
      }
    } else {
      const imgObj = existingImages.find(img => img.id === newV.image_id)
      if (editingVariant !== null) {
        setVariants(prev => prev.map((v, i) => i === editingVariant ? { ...newV, _temp: true, image_url: imgObj?.image || null } : v))
        setEditingVariant(null)
      } else {
        setVariants(prev => [...prev, { ...newV, _temp: true, image_url: imgObj?.image || null }])
      }
    }
    setVariantForm({ label: '', price: '', price_discounted: '', price_note_tr: '', image_id: '' })
  }

  const startEditVariant = (v, idx) => {
    setEditingVariant(isEdit ? v.id : idx)
    setVariantForm({
      label: v.label,
      price: String(v.price),
      price_discounted: v.price_discounted ? String(v.price_discounted) : '',
      price_note_tr: v.price_note_tr || '',
      image_id: v.image_id ? String(v.image_id) : ''
    })
  }

  const cancelEdit = () => {
    setEditingVariant(null)
    setVariantForm({ label: '', price: '', price_discounted: '', price_note_tr: '', image_id: '' })
  }

  // Varyant sıra değiştirme
  const onVarDragStart = (i) => { varDragIdx.current = i }
  const onVarDragOver = (e, i) => { e.preventDefault(); varDragOverIdx.current = i }
  const onVarDrop = async () => {
    const from = varDragIdx.current
    const to = varDragOverIdx.current
    if (from === null || to === null || from === to) return
    const reordered = [...variants]
    const [moved] = reordered.splice(from, 1)
    reordered.splice(to, 0, moved)
    const updated = reordered.map((v, i) => ({ ...v, sort_order: i }))
    setVariants(updated)
    varDragIdx.current = null
    varDragOverIdx.current = null
    // Backend'e sıra güncelle
    if (isEdit) {
      try {
        await api.post(`/products/${id}/variants/reorder`, updated.map(v => v.id).filter(Boolean))
      } catch { /* sessiz */ }
    }
  }

  // Varyant sil
  const removeVariant = async (v, idx) => {
    if (isEdit && v.id) {
      try { await api.delete(`/products/${id}/variants/${v.id}`); toast.success('Silindi') }
      catch { toast.error('Hata') }
    }
    setVariants(prev => prev.filter((_, i) => i !== idx))
  }

  const handleFileChange = e => {
    const files = Array.from(e.target.files)
    setNewFiles(prev => [...prev, ...files])
    setNewPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))])
    e.target.value = ''
  }

  const removeNewFile = i => {
    setNewFiles(prev => prev.filter((_, idx) => idx !== i))
    setNewPreviews(prev => prev.filter((_, idx) => idx !== i))
  }

  const setPrimary = async (img) => {
    if (!img.id) return
    try {
      await api.put(`/products/${id}/images/${img.id}/primary`)
      const r = await api.get(`/products/${id}`)
      setExistingImages((r.data.images || []).map((im, i) => ({
        id: (r.data.image_ids || [])[i] ?? null, image: im
      })))
      toast.success('Ana görsel güncellendi')
    } catch { toast.error('Hata oluştu') }
  }

  const deleteImage = async (img) => {
    if (!img.id) return
    if (!confirm('Bu görseli silmek istiyor musunuz?')) return
    try {
      await api.delete(`/products/${id}/images/${img.id}`)
      setExistingImages(prev => prev.filter(im => im.id !== img.id))
      toast.success('Görsel silindi')
    } catch { toast.error('Hata oluştu') }
  }

  const onDragStart = (i) => { dragIdx.current = i }
  const onDragOver = (e, i) => { e.preventDefault(); dragOverIdx.current = i }
  const onDrop = async () => {
    const from = dragIdx.current
    const to = dragOverIdx.current
    if (from === null || to === null || from === to) return
    const reordered = [...existingImages]
    const [moved] = reordered.splice(from, 1)
    reordered.splice(to, 0, moved)
    setExistingImages(reordered)
    dragIdx.current = null
    dragOverIdx.current = null
    if (to === 0 && moved.id) {
      try { await api.put(`/products/${id}/images/${moved.id}/primary`); toast.success('Ana görsel güncellendi') }
      catch { /* sessiz */ }
    }
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v === '' ? '' : String(v)))
      newFiles.forEach(f => fd.append('images', f))

      let productId = id
      if (isEdit) {
        await api.put(`/products/${id}`, fd)
        toast.success('Ürün güncellendi')
      } else {
        const res = await api.post('/products', fd)
        productId = res.data.id
        toast.success('Ürün eklendi')
        // Yeni ürün için temp varyantları kaydet
        for (const v of variants.filter(v => v._temp)) {
          await api.post(`/products/${productId}/variants`, {
            label: v.label, price: v.price, is_active: true, sort_order: v.sort_order
          }).catch(() => {})
        }
      }
      navigate('/admin/products')
    } catch (err) {
      const detail = err.response?.data?.detail
      const msg = Array.isArray(detail)
        ? detail.map(d => d.msg || JSON.stringify(d)).join(', ')
        : (typeof detail === 'string' ? detail : err.message)
      toast.error('Hata: ' + msg)
    } finally {
      setLoading(false)
    }
  }

  const f = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/admin/products')}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{isEdit ? 'Ürün Düzenle' : 'Yeni Ürün'}</h1>
          <p className="text-sm text-gray-400">{isEdit ? 'Ürün bilgilerini güncelleyin' : 'Yeni ürün ekleyin'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Sol: Ana bilgiler */}
          <div className="lg:col-span-2 space-y-6">

            {/* Dil sekmeleri */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex border-b border-gray-100">
                {['tr', 'en'].map(lang => (
                  <button key={lang} type="button" onClick={() => setActiveTab(lang)}
                    className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === lang ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
                    {lang === 'tr' ? '🇹🇷 Türkçe' : '🇬🇧 English'}
                  </button>
                ))}
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Ürün Adı {activeTab === 'tr' ? '(TR)' : '(EN)'} *
                  </label>
                  <input required
                    value={activeTab === 'tr' ? form.name_tr : form.name_en}
                    onChange={e => f(activeTab === 'tr' ? 'name_tr' : 'name_en', e.target.value)}
                    placeholder={activeTab === 'tr' ? 'Ürün adını girin...' : 'Enter product name...'}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Kısa Özet {activeTab === 'tr' ? '(TR)' : '(EN)'}
                  </label>
                  <RichEditor
                    key={`desc-${activeTab}`}
                    value={activeTab === 'tr' ? form.description_tr : form.description_en}
                    onChange={val => f(activeTab === 'tr' ? 'description_tr' : 'description_en', val)}
                    placeholder={activeTab === 'tr' ? 'Kısa ürün özeti...' : 'Short product summary...'}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Detaylı Açıklama {activeTab === 'tr' ? '(TR)' : '(EN)'}
                  </label>
                  <RichEditor
                    key={`details-${activeTab}`}
                    value={activeTab === 'tr' ? form.details_tr : form.details_en}
                    onChange={val => f(activeTab === 'tr' ? 'details_tr' : 'details_en', val)}
                    placeholder={activeTab === 'tr' ? 'Ürün özellikleri, kullanım alanları...' : 'Product features, usage areas...'}
                  />
                </div>
              </div>
            </div>

            {/* Görseller */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-semibold text-gray-900 mb-1">Ürün Görselleri</h3>
              <p className="text-xs text-gray-400 mb-4">İlk görsel ana görsel olarak kullanılır.</p>
              {existingImages.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Mevcut Görseller</p>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                    {existingImages.map((img, i) => (
                      <div key={img.id ?? i} draggable
                        onDragStart={() => onDragStart(i)}
                        onDragOver={e => onDragOver(e, i)}
                        onDrop={onDrop}
                        className="relative group aspect-square cursor-grab active:cursor-grabbing">
                        <img src={img.image} alt=""
                          className={`w-full h-full object-cover rounded-xl border-2 transition-all ${i === 0 ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'}`} />
                        {i === 0 && (
                          <div className="absolute top-1 left-1 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-lg flex items-center gap-0.5 shadow">
                            <Star size={9} fill="white" /> Ana
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                          {i !== 0 && (
                            <button type="button" onClick={() => setPrimary(img)}
                              className="w-7 h-7 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center justify-center shadow">
                              <Star size={12} />
                            </button>
                          )}
                          <button type="button" onClick={() => deleteImage(img)}
                            className="w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center justify-center shadow">
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div>
                {newPreviews.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Eklenecek Görseller</p>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                      {newPreviews.map((src, i) => (
                        <div key={i} className="relative group aspect-square">
                          <img src={src} alt="" className="w-full h-full object-cover rounded-xl border border-gray-200" />
                          <button type="button" onClick={() => removeNewFile(i)}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full hidden group-hover:flex items-center justify-center shadow">
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all group">
                  <Upload size={24} className="text-gray-300 group-hover:text-blue-400 mb-2 transition-colors" />
                  <span className="text-sm text-gray-400 group-hover:text-blue-500 transition-colors">Görsel seç veya sürükle</span>
                  <span className="text-xs text-gray-300 mt-1">PNG, JPG, WEBP</span>
                  <input type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />
                </label>
              </div>
            </div>
          </div>

          {/* Sağ: Ayarlar */}
          <div className="space-y-4">

            {/* Ürün Ayarları */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
              <h3 className="font-semibold text-gray-900">Ürün Ayarları</h3>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Kategori</label>
                <select value={form.category_id} onChange={e => f('category_id', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Kategori seçin</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name_tr}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Sıralama</label>
                <input type="number" value={form.order} onChange={e => f('order', parseInt(e.target.value) || 0)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex items-center justify-between py-2 border-t border-gray-100">
                <div>
                  <p className="text-sm font-medium text-gray-700">Aktif</p>
                  <p className="text-xs text-gray-400">Sitede görünsün mü?</p>
                </div>
                <button type="button" onClick={() => f('is_active', !form.is_active)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${form.is_active ? 'bg-blue-600' : 'bg-gray-200'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>

            {/* Fiyat Ayarları */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
              <h3 className="font-semibold text-gray-900">Varsayılan Fiyat</h3>
              <p className="text-xs text-gray-400 -mt-2">Varyant yoksa bu fiyat gösterilir</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Normal Fiyat (₺)</label>
                  <input type="number" step="0.01" min="0" value={form.price}
                    onChange={e => f('price', e.target.value)} placeholder="0.00"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">İndirimli (₺)</label>
                  <input type="number" step="0.01" min="0" value={form.price_discounted}
                    onChange={e => f('price_discounted', e.target.value)} placeholder="0.00"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Birim</label>
                  <select value={form.price_unit} onChange={e => f('price_unit', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="adet">Adet</option>
                    <option value="kg">Kg</option>
                    <option value="lt">Litre</option>
                    <option value="paket">Paket</option>
                    <option value="koli">Koli</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Min. Sipariş</label>
                  <input type="number" min="1" value={form.min_order_qty}
                    onChange={e => f('min_order_qty', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Fiyat Notu (TR)</label>
                <input value={form.price_note_tr} onChange={e => f('price_note_tr', e.target.value)}
                  placeholder="KDV dahil..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex items-center justify-between py-2 border-t border-gray-100">
                <div>
                  <p className="text-sm font-medium text-gray-700">Fiyatı Göster</p>
                  <p className="text-xs text-gray-400">Sitede fiyat görünsün mü?</p>
                </div>
                <button type="button" onClick={() => f('show_price', !form.show_price)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${form.show_price ? 'bg-blue-600' : 'bg-gray-200'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.show_price ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>

            {/* Varyantlar */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
              <div>
                <h3 className="font-semibold text-gray-900">Hacim / Varyantlar</h3>
                <p className="text-xs text-gray-400 mt-0.5">Sürükleyerek sırayı değiştirin. İlk varyant ana sayfada gösterilir.</p>
              </div>

              {variants.length > 0 && (
                <div className="space-y-2">
                  {variants.map((v, i) => (
                    <div key={v.id ?? i}
                      draggable
                      onDragStart={() => onVarDragStart(i)}
                      onDragOver={e => onVarDragOver(e, i)}
                      onDrop={onVarDrop}
                      className={`flex items-center gap-2 rounded-xl px-3 py-2 cursor-grab active:cursor-grabbing border transition-all ${
                        (isEdit ? editingVariant === v.id : editingVariant === i)
                          ? 'border-blue-400 bg-blue-50'
                          : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                      }`}>
                      <GripVertical size={14} className="text-gray-300 flex-shrink-0" />
                      <span className="text-xs text-gray-400 w-4 flex-shrink-0">{i + 1}</span>
                      {v.image_url && (
                        <img src={v.image_url} alt="" className="w-7 h-7 rounded-lg object-cover flex-shrink-0 border border-gray-200" />
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-semibold text-gray-800">{v.label}</span>
                        {v.price_discounted && v.price_discounted < v.price ? (
                          <span className="ml-2 text-xs">
                            <span className="text-blue-600 font-bold">₺{v.price_discounted}</span>
                            <span className="text-gray-400 line-through ml-1">₺{v.price}</span>
                          </span>
                        ) : (
                          <span className="text-xs text-blue-600 font-bold ml-2">₺{v.price}</span>
                        )}
                        {v.price_note_tr && <span className="text-xs text-gray-400 ml-1">· {v.price_note_tr}</span>}
                      </div>
                      <button type="button" onClick={() => startEditVariant(v, i)}
                        className="text-blue-400 hover:text-blue-600 p-1 flex-shrink-0">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button type="button" onClick={() => removeVariant(v, i)}
                        className="text-red-400 hover:text-red-600 p-1 flex-shrink-0">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Ekle / Düzenle formu */}
              <div className="space-y-2 border border-dashed border-gray-200 rounded-xl p-3">
                <p className="text-xs font-semibold text-gray-500">
                  {editingVariant !== null ? '✏️ Varyant Düzenle' : '+ Yeni Varyant'}
                </p>
                <div className="flex gap-2">
                  <input
                    value={variantForm.label}
                    onChange={e => setVariantForm(f => ({ ...f, label: e.target.value }))}
                    placeholder="1 Litre, 5 Litre, 20 Litre..."
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Normal Fiyat (₺) *</label>
                    <input type="number" step="0.01" min="0"
                      value={variantForm.price}
                      onChange={e => setVariantForm(f => ({ ...f, price: e.target.value }))}
                      placeholder="0.00"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">İndirimli Fiyat (₺)</label>
                    <input type="number" step="0.01" min="0"
                      value={variantForm.price_discounted}
                      onChange={e => setVariantForm(f => ({ ...f, price_discounted: e.target.value }))}
                      placeholder="0.00"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Fiyat Notu (TR)</label>
                  <input
                    value={variantForm.price_note_tr}
                    onChange={e => setVariantForm(f => ({ ...f, price_note_tr: e.target.value }))}
                    placeholder="KDV dahil, Toplu fiyat için arayın..."
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                {existingImages.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1.5">Görsel seç (opsiyonel):</p>
                    <div className="flex flex-wrap gap-2">
                      <button type="button"
                        onClick={() => setVariantForm(f => ({ ...f, image_id: '' }))}
                        className={`w-9 h-9 rounded-lg border-2 flex items-center justify-center text-xs transition-all ${!variantForm.image_id ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-200 text-gray-400'}`}>
                        —
                      </button>
                      {existingImages.map((img, i) => (
                        <button key={img.id ?? i} type="button"
                          onClick={() => setVariantForm(f => ({ ...f, image_id: img.id ? String(img.id) : '' }))}
                          className={`w-9 h-9 rounded-lg border-2 overflow-hidden transition-all ${String(variantForm.image_id) === String(img.id) ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-blue-300'}`}>
                          <img src={img.image} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button type="button" onClick={addVariant}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl text-sm font-medium transition-colors">
                    <Plus size={14} /> {editingVariant !== null ? 'Güncelle' : 'Ekle'}
                  </button>
                  {editingVariant !== null && (
                    <button type="button" onClick={cancelEdit}
                      className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50 transition-colors">
                      İptal
                    </button>
                  )}
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl transition-all hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-60">
              {loading ? 'Kaydediliyor...' : (isEdit ? 'Güncelle' : 'Ürün Ekle')}
            </button>
            <button type="button" onClick={() => navigate('/admin/products')}
              className="w-full border border-gray-200 text-gray-600 font-medium py-3 rounded-2xl hover:bg-gray-50 transition-colors">
              İptal
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
