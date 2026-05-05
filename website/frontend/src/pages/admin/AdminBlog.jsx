import React, { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X, Upload } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../api/axios'

const EMPTY = { title_tr: '', title_en: '', summary_tr: '', summary_en: '', content_tr: '', content_en: '', is_active: true }

export default function AdminBlog() {
  const [posts, setPosts] = useState([])
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [imageFile, setImageFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [tab, setTab] = useState('tr')

  const load = () => {
    api.get('/blog').then(r => setPosts(r.data)).catch(() => {})
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY)
    setImageFile(null)
    setPreview('')
    setTab('tr')
    setModal(true)
  }

  const openEdit = p => {
    setEditing(p)
    setForm({
      title_tr: p.title_tr, title_en: p.title_en,
      summary_tr: p.summary_tr, summary_en: p.summary_en,
      content_tr: p.content_tr, content_en: p.content_en,
      is_active: p.is_active
    })
    setPreview(p.image || '')
    setImageFile(null)
    setTab('tr')
    setModal(true)
  }

  const handleImageChange = e => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      setPreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async e => {
    e.preventDefault()
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)))
    if (imageFile) fd.append('image', imageFile)
    try {
      if (editing) await api.put(`/blog/${editing.id}`, fd)
      else await api.post('/blog', fd)
      toast.success(editing ? 'Güncellendi' : 'Eklendi')
      setModal(false)
      load()
    } catch {
      toast.error('Hata oluştu')
    }
  }

  const handleDelete = async id => {
    if (!confirm('Silmek istediğinize emin misiniz?')) return
    try {
      await api.delete(`/blog/${id}`)
      toast.success('Silindi')
      load()
    } catch {
      toast.error('Hata oluştu')
    }
  }

  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Blog Yazıları</h1>
        <button onClick={openCreate}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors">
          <Plus size={16} /> Yeni Yazı
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase">Görsel</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase">Başlık</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase hidden md:table-cell">Tarih</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase">Durum</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-500 text-xs uppercase">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {posts.length === 0 && (
              <tr><td colSpan={5} className="text-center py-12 text-gray-400">Henüz yazı yok</td></tr>
            )}
            {posts.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  {p.image
                    ? <img src={p.image} alt="" className="w-12 h-12 rounded-xl object-cover" />
                    : <div className="w-12 h-12 bg-gray-100 rounded-xl" />}
                </td>
                <td className="px-4 py-3">
                  <p className="font-semibold text-gray-900 line-clamp-1">{p.title_tr}</p>
                  <p className="text-xs text-gray-400 line-clamp-1">{p.title_en}</p>
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs hidden md:table-cell">
                  {p.created_at ? new Date(p.created_at).toLocaleDateString('tr-TR') : '-'}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${p.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {p.is_active ? 'Aktif' : 'Pasif'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => openEdit(p)} className="p-2 hover:bg-blue-50 rounded-xl text-gray-400 hover:text-blue-600 transition-colors">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="p-2 hover:bg-red-50 rounded-xl text-gray-400 hover:text-red-600 transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">{editing ? 'Yazı Düzenle' : 'Yeni Yazı'}</h2>
              <button onClick={() => setModal(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="flex border border-gray-200 rounded-xl overflow-hidden">
                {['tr', 'en'].map(l => (
                  <button key={l} type="button" onClick={() => setTab(l)}
                    className={`flex-1 py-2 text-sm font-semibold transition-colors ${tab === l ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
                    {l === 'tr' ? '🇹🇷 Türkçe' : '🇬🇧 English'}
                  </button>
                ))}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Başlık ({tab.toUpperCase()})</label>
                <input required value={tab === 'tr' ? form.title_tr : form.title_en}
                  onChange={e => f(tab === 'tr' ? 'title_tr' : 'title_en', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Özet ({tab.toUpperCase()})</label>
                <textarea rows={2} value={tab === 'tr' ? form.summary_tr : form.summary_en}
                  onChange={e => f(tab === 'tr' ? 'summary_tr' : 'summary_en', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">İçerik ({tab.toUpperCase()})</label>
                <textarea rows={6} value={tab === 'tr' ? form.content_tr : form.content_en}
                  onChange={e => f(tab === 'tr' ? 'content_tr' : 'content_en', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Kapak Görseli</label>
                {preview && <img src={preview} alt="" className="w-full h-32 object-cover rounded-xl mb-2" />}
                <label className="flex items-center gap-2 cursor-pointer border border-dashed border-gray-200 rounded-xl px-4 py-3 hover:border-blue-400 hover:bg-blue-50 transition-all">
                  <Upload size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-500">Görsel seç</span>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="blog_active" checked={form.is_active}
                  onChange={e => f('is_active', e.target.checked)} className="rounded" />
                <label htmlFor="blog_active" className="text-sm text-gray-700">Aktif</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(false)}
                  className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50">
                  İptal
                </button>
                <button type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-medium">
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
