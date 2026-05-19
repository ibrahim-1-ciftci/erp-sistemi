import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, Search, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../api/axios'

export default function AdminProducts() {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    Promise.all([
      api.get('/products'),
      api.get('/categories'),
    ]).then(([p, c]) => {
      setProducts(p.data)
      setCategories(c.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }
  useEffect(load, [])

  const handleDelete = async id => {
    if (!confirm('Silmek istediğinize emin misiniz?')) return
    try {
      await api.delete(`/products/${id}`)
      toast.success('Silindi')
      load()
    } catch { toast.error('Hata oluştu') }
  }

  const toggleActive = async (p) => {
    try {
      const fd = new FormData()
      fd.append('name_tr', p.name_tr)
      fd.append('name_en', p.name_en)
      fd.append('description_tr', p.description_tr || '')
      fd.append('description_en', p.description_en || '')
      fd.append('details_tr', p.details_tr || '')
      fd.append('details_en', p.details_en || '')
      fd.append('category_id', p.category_id || '')
      fd.append('is_active', String(!p.is_active))
      fd.append('order', String(p.order))
      await api.put(`/products/${p.id}`, fd)
      toast.success(p.is_active ? 'Pasife alındı' : 'Aktif edildi')
      load()
    } catch { toast.error('Hata oluştu') }
  }

  const filtered = products.filter(p => {
    const matchSearch = !search || p.name_tr.toLowerCase().includes(search.toLowerCase()) || p.name_en.toLowerCase().includes(search.toLowerCase())
    const matchCat = !filterCat || String(p.category_id) === filterCat
    const matchStatus = !filterStatus || (filterStatus === 'active' ? p.is_active : !p.is_active)
    return matchSearch && matchCat && matchStatus
  })

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Ürünler</h1>
          <p className="text-sm text-gray-400 mt-0.5">{products.length} ürün · {products.filter(p => p.is_active).length} aktif</p>
        </div>
        <button onClick={() => navigate('/admin/products/new')}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm shadow-blue-500/20">
          <Plus size={16} /> Yeni Ürün
        </button>
      </div>

      {/* Filtreler */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Ürün ara..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
          />
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600">
          <option value="">Tüm Kategoriler</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name_tr}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600">
          <option value="">Tüm Durumlar</option>
          <option value="active">Aktif</option>
          <option value="passive">Pasif</option>
        </select>
        {(search || filterCat || filterStatus) && (
          <button onClick={() => { setSearch(''); setFilterCat(''); setFilterStatus('') }}
            className="text-xs text-gray-400 hover:text-gray-600 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors">
            Temizle
          </button>
        )}
      </div>

      {/* Tablo */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Görsel</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Ürün Adı</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider hidden md:table-cell">Kategori</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider hidden md:table-cell">Fiyat</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Durum</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading && (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-4 py-3"><div className="w-10 h-10 bg-gray-100 rounded-lg animate-pulse" /></td>
                  <td className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse w-40" /></td>
                  <td className="px-4 py-3 hidden md:table-cell"><div className="h-4 bg-gray-100 rounded animate-pulse w-24" /></td>
                  <td className="px-4 py-3 hidden md:table-cell"><div className="h-4 bg-gray-100 rounded animate-pulse w-20" /></td>
                  <td className="px-4 py-3"><div className="h-5 bg-gray-100 rounded-full animate-pulse w-14" /></td>
                  <td className="px-4 py-3" />
                </tr>
              ))
            )}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={6} className="text-center py-12 text-gray-400">Ürün bulunamadı</td></tr>
            )}
            {!loading && filtered.map(p => (
              <tr key={p.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/admin/products/${p.id}`)}>
                <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                  {p.image
                    ? <img src={p.image} alt="" className="w-10 h-10 rounded-xl object-cover" />
                    : <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-300 text-xs">?</div>}
                </td>
                <td className="px-4 py-3">
                  <p className="font-semibold text-gray-900">{p.name_tr}</p>
                  <p className="text-xs text-gray-400">{p.name_en}</p>
                </td>
                <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                  {p.category?.name_tr || <span className="text-gray-300">—</span>}
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  {p.variants && p.variants.length > 0 ? (
                    <div>
                      {(() => {
                        const v = p.variants[0]
                        const hasDiscount = v.price_discounted && v.price_discounted < v.price
                        return hasDiscount ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-blue-600">{v.price_discounted.toLocaleString('tr-TR')} ₺</span>
                            <span className="text-xs text-gray-400 line-through">{v.price.toLocaleString('tr-TR')} ₺</span>
                          </div>
                        ) : (
                          <span className="font-semibold text-blue-600">{v.price.toLocaleString('tr-TR')} ₺</span>
                        )
                      })()}
                      <p className="text-xs text-gray-400">/ {p.variants[0].label}
                        {p.variants.length > 1 && <span className="ml-1 text-gray-300">+{p.variants.length - 1}</span>}
                      </p>
                    </div>
                  ) : p.show_price && p.price > 0 ? (
                    <div>
                      {p.price_discounted && p.price_discounted < p.price ? (
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-blue-600">{p.price_discounted.toLocaleString('tr-TR')} ₺</span>
                          <span className="text-xs text-gray-400 line-through">{p.price.toLocaleString('tr-TR')} ₺</span>
                        </div>
                      ) : (
                        <span className="font-semibold text-blue-600">{p.price.toLocaleString('tr-TR')} ₺</span>
                      )}
                      <p className="text-xs text-gray-400">/ {p.price_unit || 'adet'}</p>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-300">—</span>
                  )}
                </td>
                <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                  <button onClick={() => toggleActive(p)}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${p.is_active ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                    {p.is_active ? 'Aktif' : 'Pasif'}
                  </button>
                </td>
                <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => window.open(`/urun/${p.id}`, '_blank')}
                      className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors" title="Sitede gör">
                      <Eye size={15} />
                    </button>
                    <button onClick={() => navigate(`/admin/products/${p.id}`)}
                      className="p-1.5 hover:bg-blue-50 rounded-lg text-gray-400 hover:text-blue-600 transition-colors">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => handleDelete(p.id)}
                      className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && filtered.length > 0 && (
          <div className="px-4 py-2.5 border-t border-gray-50 text-xs text-gray-400">
            {filtered.length} / {products.length} ürün gösteriliyor
          </div>
        )}
      </div>
    </div>
  )
}
