import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Upload, X, GripVertical, Star } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../api/axios'

const EMPTY = {
  name_tr: '', name_en: '',
  description_tr: '', description_en: '',
  details_tr: '', details_en: '',
  category_id: '', is_active: true, order: 0
}

export default function AdminProductForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [form, setForm] = useState(EMPTY)
  const [categories, setCategories] = useState([])
  const [existingImages, setExistingImages] = useState([]) // {id, image}
  const [newFiles, setNewFiles] = useState([])
  const [newPreviews, setNewPreviews] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('tr')

  useEffect(() => {
    api.get('/categories').then(r => setCategories(r.data)).catch(() => {})
    if (isEdit) {
      api.get(`/products/${id}`).then(r => {
        const p = r.data
        setForm({
          name_tr: p.name_tr, name_en: p.name_en,
          description_tr: p.description_tr || '', description_en: p.description_en || '',
          details_tr: p.details_tr || '', details_en: p.details_en || '',
          category_id: p.category_id || '', is_active: p.is_active, order: p.order
        })
        // image_ids backend'den gelmiyor, index kullanacağız
        setExistingImages((p.images || []).map((img, i) => ({ idx: i, image: img })))
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
      toast.error('Hata: ' + (err.response?.data?.detail || err.message))
    } finally {
      setLoading(false)
    }
  }

  const f = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  return (
    <div className="p-6 max-w-5xl">
      {/* Header */}
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

          {/* Sol kolon: Ana bilgiler */}
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
                    <span className="ml-1 text-gray-400 normal-case font-normal">— Ürün sayfasında fotoğrafın yanında gösterilir</span>
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
                    <span className="ml-1 text-gray-400 normal-case font-normal">— Fotoğrafın altında gösterilir</span>
                  </label>
                  <textarea rows={8}
                    value={activeTab === 'tr' ? form.details_tr : form.details_en}
                    onChange={e => f(activeTab === 'tr' ? 'details_tr' : 'details_en', e.target.value)}
                    placeholder={activeTab === 'tr' ? 'Ürün özellikleri, kullanım alanları, avantajlar...' : 'Product features, usage areas, advantages...'}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                </div>
              </div>
            </div>

            {/* Görseller */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                Ürün Görselleri
                <span className="text-xs font-normal text-gray-400">— İlk görsel ana görsel olarak kullanılır</span>
              </h3>

              {/* Mevcut görseller */}
              {existingImages.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Mevcut Görseller</p>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                    {existingImages.map((img, i) => (
                      <div key={i} className="relative group aspect-square">
                        <img src={img.image} alt="" className="w-full h-full object-cover rounded-xl border border-gray-200" />
                        {i === 0 && (
                          <div className="absolute top-1 left-1 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-lg flex items-center gap-0.5">
                            <Star size={10} /> Ana
                          </div>
                        )}
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
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs hidden group-hover:flex items-center justify-center shadow">
                            <X size={10} />
                          </button>
                          {existingImages.length === 0 && i === 0 && (
                            <div className="absolute top-1 left-1 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-lg flex items-center gap-0.5">
                              <Star size={10} /> Ana
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

          {/* Sağ kolon: Ayarlar */}
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

            {/* Kaydet butonu */}
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
