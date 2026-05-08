import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import api from '../api/axios'
import ProductCard from '../components/ProductCard'
import useSEO from '../hooks/useSEO'

export default function Products() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])

  // URL'den state oku
  const search = searchParams.get('q') || ''
  const activeCategoryId = searchParams.get('cat') ? parseInt(searchParams.get('cat')) : null

  useSEO({
    title: lang === 'tr' ? 'Ürünler' : 'Products',
    description: lang === 'tr'
      ? 'Laves Kimya oto bakım ürünleri kataloğu. Şampuan, cila, temizlik ve bakım ürünleri.'
      : 'Laves Chemistry automotive care product catalog. Shampoo, polish, cleaning and care products.',
  })

  useEffect(() => {
    api.get('/products?active_only=true').then(r => setProducts(r.data)).catch(() => {})
    api.get('/categories').then(r => setCategories(r.data)).catch(() => {})
  }, [])

  const setSearch = (val) => {
    const p = new URLSearchParams(searchParams)
    if (val) p.set('q', val); else p.delete('q')
    setSearchParams(p, { replace: true })
  }

  const setCategory = (id) => {
    const p = new URLSearchParams(searchParams)
    if (id !== null) p.set('cat', id); else p.delete('cat')
    setSearchParams(p, { replace: true })
  }

  const filtered = products.filter(p => {
    const name = lang === 'tr' ? p.name_tr : p.name_en
    const desc = lang === 'tr' ? p.description_tr : p.description_en
    const matchCat = activeCategoryId === null || p.category_id === activeCategoryId
    const matchSearch = !search ||
      name.toLowerCase().includes(search.toLowerCase()) ||
      (desc || '').toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const activeCategory = categories.find(c => c.id === activeCategoryId)

  return (
    <div className="pt-16 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">{t('products.title')}</h1>
          <p className="text-gray-500 text-sm">
            {filtered.length !== products.length
              ? (lang === 'tr' ? `${filtered.length} / ${products.length} ürün` : `${filtered.length} / ${products.length} products`)
              : (lang === 'tr' ? `${products.length} ürün` : `${products.length} products`)}
            {activeCategory && (
              <span className="ml-2 text-blue-600 font-medium">
                · {lang === 'tr' ? activeCategory.name_tr : activeCategory.name_en}
              </span>
            )}
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
              className="w-full pl-9 pr-9 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Category filter */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCategory(null)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeCategoryId === null ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-400'}`}>
              {t('products.all')}
            </button>
            {categories.map(c => (
              <button key={c.id}
                onClick={() => setCategory(c.id)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeCategoryId === c.id ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-400'}`}>
                {lang === 'tr' ? c.name_tr : c.name_en}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 mb-3">{lang === 'tr' ? 'Ürün bulunamadı.' : 'No products found.'}</p>
            <button onClick={() => { setSearch(''); setCategory(null) }}
              className="text-blue-600 text-sm font-medium hover:underline">
              {lang === 'tr' ? 'Filtreleri temizle' : 'Clear filters'}
            </button>
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
