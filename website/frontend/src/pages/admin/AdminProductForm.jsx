import React, { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Upload, X, Star, GripVertical } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../api/axios'

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
  const [existingImages, setExistingImages] = useState([]) // [{id, image}]
  const [newFiles, setNewFiles] = useState([])
  const [newPreviews, setNewPreviews] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('tr')

  // Drag state
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
      }).catch(() => navigate('/admin/products'))
    }
  }, [id])

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

  // Mevcut görseli ana yap (backend'e bildir)
  const setPrimary = async (img) => {
    if (!img.id) return
    try {
      await api.put(`/products/${id}/images/${img.id}/primary`)
      const r = await api.get(`/products/${id}`)
      setExistingImages((r.data.images || []).map((im, i) => ({
        id: (r.data.image_ids || [])[i] ?? null,
        image: im
      })))
      toast.success('Ana görsel güncellendi')
    } catch {
      toast.error('Hata oluştu')
    }
  }

  // Mevcut görseli sil
  const deleteImage = async (img) => {
    if (!img.id) return
    if (!confirm('Bu görseli silmek istiyor musunuz?')) return
    try {
      await api.delete(`/products/${id}/images/${img.id}`)
      setExistingImages(prev => prev.filter(im => im.id !== img.id))
      toast.success('Görsel silindi')
    } catch {
      toast.error('Hata oluştu')
    }
  }

  // Drag & drop sıralama — sadece local state, kaydet butonuyla backend'e gönder
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

    // İlk sıraya taşındıysa backend'e bildir
    if (to === 0 && moved.id) {
      try {
        await api.put(`/products/${id}/images/${moved.id}/primary`)
        toast.success('Ana görsel güncellendi')
      } catch { /* sessiz */ }
    }
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v === '' ? '' : String(v)))
      newFiles.forEach(f => fd.append('images', f))

      if (isEdit) {
        await api.put(`/products/${id}`, fd)
        toast.success('Ürün güncellendi')
      } else {
        await api.post('/products', fd)
        toast.success('Ürün eklendi')
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
                    <span className="ml-1 text-gray-400 normal-case font-normal">— Ürün sayfasında fotoğrafın yanında</span>
                  </label>
                  <textarea rows={3}
                    value={activeTab === 'tr' ? form.description_tr : form.description_en}
                    onChange={e => f(activeTab === 'tr' ? 'description_tr' : 'description_en', e.target.value)}
                    placeholder={activeTab === 'tr' ? 'Kısa ürün özeti...' : 'Short product summary...'}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Detaylı Açıklama {activeTab === 'tr' ? '(TR)' : '(EN)'}
                    <span className="ml-1 text-gray-400 normal-case font-normal">— Fotoğrafın altında</span>
                  </label>
                  <textarea rows={8}
                    value={activeTab === 'tr' ? form.details_tr : form.details_en}
                    onChange={e => f(activeTab === 'tr' ? 'details_tr' : 'details_en', e.target.value)}
                    placeholder={activeTab === 'tr' ? 'Ürün özellikleri, kullanım alanları...' : 'Product features, usage areas...'}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                </div>
              </div>
            </div>

            {/* Görseller */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                Ürün Görselleri
              </h3>
              <p className="text-xs text-gray-400 mb-4">
                İlk görsel ana görsel olarak kullanılır. Sürükleyerek sırayı değiştirebilirsiniz.
                <span className="ml-1 text-blue-500">⭐ = Ana görsel</span>
              </p>

              {/* Mevcut görseller — drag & drop */}
              {existingImages.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Mevcut Görseller
                    <span className="ml-2 font-normal text-gray-400 normal-case">Sürükleyerek sırala, ⭐ ile ana yap</span>
                  </p>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                    {existingImages.map((img, i) => (
                      <div
                        key={img.id ?? i}
                        draggable
                        onDragStart={() => onDragStart(i)}
                        onDragOver={e => onDragOver(e, i)}
                        onDrop={onDrop}
                        className="relative group aspect-square cursor-grab active:cursor-grabbing">
                        <img src={img.image} alt=""
                          className={`w-full h-full object-cover rounded-xl border-2 transition-all ${i === 0 ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'}`} />
                        {/* Ana görsel rozeti */}
                        {i === 0 && (
                          <div className="absolute top-1 left-1 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-lg flex items-center gap-0.5 shadow">
                            <Star size={9} fill="white" /> Ana
                          </div>
                        )}
                        {/* Sıra numarası */}
                        {i > 0 && (
                          <div className="absolute top-1 left-1 bg-black/50 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                            {i + 1}
                          </div>
                        )}
                        {/* Hover aksiyonlar */}
                        <div className="absolute inset-0 bg-black/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                          {i !== 0 && (
                            <button type="button" onClick={() => setPrimary(img)}
                              title="Ana görsel yap"
                              className="w-7 h-7 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center justify-center shadow">
                              <Star size={12} />
                            </button>
                          )}
                          <button type="button" onClick={() => deleteImage(img)}
                            title="Sil"
                            className="w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center justify-center shadow">
                            <X size={12} />
                          </button>
                        </div>
                        {/* Drag handle */}
                        <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <GripVertical size={14} className="text-white drop-shadow" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Yeni görsel ekle */}
              <div>
                {newPreviews.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Eklenecek Görseller</p>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                      {newPreviews.map((src, i) => (
                        <div key={i} className="relative group aspect-square">
                          <img src={src} alt="" className="w-full h-full object-cover rounded-xl border border-gray-200" />
                          <button type="button" onClick={() => removeNewFile(i)}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full hidden group-hover:flex items-center justify-center shadow">
                            <X size={10} />
                          </button>
                          {existingImages.length === 0 && i === 0 && (
                            <div className="absolute top-1 left-1 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-lg flex items-center gap-0.5">
                              <Star size={9} fill="white" /> Ana
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all group">
                  <Upload size={24} className="text-gray-300 group-hover:text-blue-400 mb-2 transition-colors" />
                  <span className="text-sm text-gray-400 group-hover:text-blue-500 transition-colors">Görsel seç veya sürükle</span>
                  <span className="text-xs text-gray-300 mt-1">PNG, JPG, WEBP — Birden fazla seçebilirsiniz</span>
                  <input type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />
                </label>
              </div>
            </div>
          </div>

          {/* Sağ: Ayarlar */}
          <div className="space-y-4">
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
                <p className="text-xs text-gray-400 mt-1">Küçük sayı önce gösterilir</p>
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
              <h3 className="font-semibold text-gray-900">Fiyat Ayarları</h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Normal Fiyat (₺)</label>
                  <input type="number" step="0.01" min="0" value={form.price}
                    onChange={e => f('price', e.target.value)}
                    placeholder="0.00"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">İndirimli Fiyat (₺)</label>
                  <input type="number" step="0.01" min="0" value={form.price_discounted}
                    onChange={e => f('price_discounted', e.target.value)}
                    placeholder="0.00"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              {/* İndirim önizleme */}
              {form.price && form.price_discounted && parseFloat(form.price_discounted) < parseFloat(form.price) && (
                <div className="bg-green-50 rounded-xl px-3 py-2 text-xs text-green-700 font-medium">
                  %{Math.round((1 - parseFloat(form.price_discounted) / parseFloat(form.price)) * 100)} indirim
                </div>
              )}

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
                  placeholder="KDV dahil, Toplu fiyat için arayın..."
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
