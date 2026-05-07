import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../api/axios'

export default function AdminProducts() {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])

  const load = () => {
    api.get('/products').then(r => setProducts(r.data)).catch(() => {})
    api.get('/categories').then(r => setCategories(r.data)).catch(() => {})
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

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Ürünler</h1>
        <button
          onClick={() => navigate('/admin/products/new')}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
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
            {products.length === 0 && (
              <tr><td colSpan={6} className="text-center py-12 text-gray-400">Henüz ürün yok</td></tr>
            )}
            {products.map(p => (
              <tr key={p.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/admin/products/${p.id}`)}>
                <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                  {p.image
                    ? <img src={p.image} alt="" className="w-10 h-10 rounded-lg object-cover" />
                    : <div className="w-10 h-10 bg-gray-100 rounded-lg" />}
                </td>
                <td className="px-4 py-3 font-medium text-gray-900">{p.name_tr}</td>
                <td className="px-4 py-3 text-gray-500">{p.name_en}</td>
                <td className="px-4 py-3 text-gray-500">{p.category?.name_tr || '-'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {p.is_active ? 'Aktif' : 'Pasif'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => navigate(`/admin/products/${p.id}`)}
                      className="p-1.5 hover:bg-blue-50 rounded-lg text-gray-400 hover:text-blue-600 transition-colors">
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
