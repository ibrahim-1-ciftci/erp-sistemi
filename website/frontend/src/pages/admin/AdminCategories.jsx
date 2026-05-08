import React, { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X, Tag } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../api/axios'

const EMPTY = { name_tr: '', name_en: '', slug: '', order: 0 }

function toSlug(str) {
  return str.toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export default function AdminCategories() {
  const [categories, setCategories] = useState([])
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [productCounts, setProductCounts] = useState({})

  const load = async () => {
    const [cats, prods] = await Promise.all([
      api.get('/categories').then(r => r.data).catch(() => []),
      api.get('/products').then(r => r.data).catch(() => []),
    ])
    setCategories(cats)
    const counts = {}
    prods.forEach(p => { if (p.category_id) counts[p.category_id] = (counts[p.category_id] || 0) + 1 })
    setProductCounts(counts)
  }
  useEffect(() => { load() }, [])

  const openCreate = () => { setEditing(null); setForm(EMPTY); setModal(true) }
  const openEdit = c => { setEditing(c); setForm({ name_tr: c.name_tr, name_en: c.name_en, slug: c.slug, order: c.order }); setModal(true) }

  const handleNameTrChange = (val) => {
    setForm(prev => ({
      ...prev,
      name_tr: val,
      slug: prev.slug === toSlug(prev.name_tr) || prev.slug === '' ? toSlug(val) : prev.slug
    }))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    try {
      if (editing) await api.put(`/categories/${editing.id}`, form)
      else await api.post('/categories', form)
      toast.success(editing ? 'Güncellendi' : 'Eklendi')
      setModal(false)
      load()
    } catch { toast.error('Hata oluştu') }
  }

  const handleDelete = async id => {
    if (productCounts[id] > 0) {
      toast.error(`Bu kategoride ${productCounts[id]} ürün var. Önce ürünleri taşıyın.`)
      return
    }
    if (!confirm('Silmek istediğinize emin misiniz?')) return
    await api.delete(`/categories/${id}`).catch(() => {})
    toast.success('Silindi')
    load()
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Kategoriler</h1>
          <p className="text-sm text-gray-400 mt-0.5">{categories.length} kategori</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors">
          <Plus size={16} /> Yeni Kategori
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map(c => (
          <div key={c.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <Tag size={18} className="text-blue-600" />
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(c)}
                  className="p-1.5 hover:bg-blue-50 rounded-lg text-gray-400 hover:text-blue-600 transition-colors">
                  <Pencil size={14} />
                </button>
                <button onClick={() => handleDelete(c.id)}
                  className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <h3 className="font-bold text-gray-900">{c.name_tr}</h3>
            <p className="text-sm text-gray-400">{c.name_en}</p>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
              <span className="text-xs font-mono text-gray-400">{c.slug}</span>
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                {productCounts[c.id] || 0} ürün
              </span>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">{editing ? 'Kategori Düzenle' : 'Yeni Kategori'}</h2>
              <button onClick={() => setModal(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Ad (TR) *</label>
                  <input required value={form.name_tr} onChange={e => handleNameTrChange(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Ad (EN) *</label>
                  <input required value={form.name_en} onChange={e => setForm({...form, name_en: e.target.value})}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Slug
                    <span className="ml-1 text-gray-400 font-normal">(otomatik)</span>
                  </label>
                  <input value={form.slug} onChange={e => setForm({...form, slug: e.target.value})}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Sıra</label>
                  <input type="number" value={form.order} onChange={e => setForm({...form, order: parseInt(e.target.value) || 0})}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(false)}
                  className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50">İptal</button>
                <button type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-semibold">
                  {editing ? 'Güncelle' : 'Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
