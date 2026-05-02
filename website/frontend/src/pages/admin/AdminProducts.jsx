import React, { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../api/axios'

const EMPTY = { name_tr: '', name_en: '', description_tr: '', description_en: '', category_id: '', is_active: true, order: 0 }

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [imageFile, setImageFile] = useState(null)

  const load = () => {
    api.get('/products').then(r => setProducts(r.data)).catch(() => {})
    api.get('/categories').then(r => setCategories(r.data)).catch(() => {})
  }
  useEffect(load, [])

  const openCreate = () => { setEditing(null); setForm(EMPTY); setImageFile(null); setModal(true) }
  const openEdit = p => {
    setEditing(p)
    setForm({ name_tr: p.name_tr, name_en: p.name_en, description_tr: p.description_tr, description_en: p.description_en, category_id: p.category_id || '', is_active: p.is_active, order: p.order })
    setImageFile(null)
    setModal(true)
  }

  const handleSubmit = async e => {
    e.preventDefault()
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => fd.append(k, v === '' ? '' : v))
    if (imageFile) fd.append('image', imageFile)
    try {
      if (editing) await api.put(`/products/${editing.id}`, fd)
      else await api.post('/products', fd)
      toast.success(editing ? 'Güncellendi' : 'Eklendi')
      setModal(false)
      load()
    } catch { toast.error('Hata oluştu') }
  }

  const handleDelete = async id => {
    if (!confirm('Silmek istediğinize emin misiniz?')) return
    await api.delete(`/products/${id}`)
    toast.success('Silindi')
    load()
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Ürünler</h1>
        <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
          <Plus size={16} /> Yeni Ürün
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Görsel</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Ürün Adı (TR)</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Ürün Adı (EN)</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Kategori</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Durum</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {products.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  {p.image ? <img src={p.image} alt="" className="w-10 h-10 rounded-lg object-cover" /> : <div className="w-10 h-10 bg-gray-100 rounded-lg" />}
                </td>
                <td className="px-4 py-3 font-medium text-gray-900">{p.name_tr}</td>
                <td className="px-4 py-3 text-gray-500">{p.name_en}</td>
                <td className="px-4 py-3 text-gray-500">{p.category?.name_tr || '-'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {p.is_active ? 'Aktif' : 'Pasif'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => openEdit(p)} className="p-1.5 hover:bg-blue-50 rounded-lg text-gray-400 hover:text-blue-600 transition-colors"><Pencil size={15} /></button>
                    <button onClick={() => handleDelete(p.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-colors"><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">{editing ? 'Ürün Düzenle' : 'Yeni Ürün'}</h2>
              <button onClick={() => setModal(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Ad (TR)</label>
                  <input required value={form.name_tr} onChange={e => setForm({...form, name_tr: e.target.value})}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Ad (EN)</label>
                  <input required value={form.name_en} onChange={e => setForm({...form, name_en: e.target.value})}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Açıklama (TR)</label>
                <textarea rows={2} value={form.description_tr} onChange={e => setForm({...form, description_tr: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Açıklama (EN)</label>
                <textarea rows={2} value={form.description_en} onChange={e => setForm({...form, description_en: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Kategori</label>
                  <select value={form.category_id} onChange={e => setForm({...form, category_id: e.target.value})}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Seçiniz</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name_tr}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Sıra</label>
                  <input type="number" value={form.order} onChange={e => setForm({...form, order: parseInt(e.target.value)})}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Görsel</label>
                <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])}
                  className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-600 file:text-xs file:font-medium" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="active" checked={form.is_active} onChange={e => setForm({...form, is_active: e.target.checked})} className="rounded" />
                <label htmlFor="active" className="text-sm text-gray-700">Aktif</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(false)}
                  className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                  İptal
                </button>
                <button type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-medium transition-colors">
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
