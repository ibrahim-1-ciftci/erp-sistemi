import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Search } from 'lucide-react'
import api from '../api/axios'
import ProductCard from '../components/ProductCard'

export default function Products() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [activeCategory, setActiveCategory] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.get('/products?active_only=true').then(r => setProducts(r.data)).catch(() => {})
    api.get('/categories').then(r => setCategories(r.data)).catch(() => {})
  }, [])

  const filtered = products.filter(p => {
    const name = lang === 'tr' ? p.name_tr : p.name_en
    const matchCat = activeCategory === null || p.category_id === activeCategory
    const matchSearch = name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  return (
    <div className="pt-16 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('products.title')}</h1>
          <p className="text-gray-500">
            {lang === 'tr' ? `${products.length} ürün listeleniyor` : `${products.length} products listed`}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={lang === 'tr' ? 'Ürün ara...' : 'Search products...'}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category filter */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeCategory === null ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-400'}`}>
              {t('products.all')}
            </button>
            {categories.map(c => (
              <button key={c.id}
                onClick={() => setActiveCategory(c.id)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeCategory === c.id ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-400'}`}>
                {lang === 'tr' ? c.name_tr : c.name_en}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            {lang === 'tr' ? 'Ürün bulunamadı.' : 'No products found.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </div>
  )
}
