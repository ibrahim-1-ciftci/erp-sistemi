import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Search, X } from 'lucide-react'
import api from '../api/axios'

export default function SearchBar({ large = false }) {
  const { i18n } = useTranslation()
  const lang = i18n.language
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [allProducts, setAllProducts] = useState([])
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    api.get('/products?active_only=true').then(r => setAllProducts(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); setOpen(false); return }
    const q = query.toLowerCase()
    const filtered = allProducts.filter(p => {
      const name = (lang === 'tr' ? p.name_tr : p.name_en).toLowerCase()
      const desc = (lang === 'tr' ? p.description_tr : p.description_en).toLowerCase()
      return name.includes(q) || desc.includes(q)
    }).slice(0, 6)
    setResults(filtered)
    setOpen(true)
  }, [query, allProducts, lang])

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelect = (id) => {
    setQuery('')
    setOpen(false)
    navigate(`/urun/${id}`)
  }

  const handleSubmit = e => {
    e.preventDefault()
    if (query.trim()) {
      setOpen(false)
      navigate(`/urunler?q=${encodeURIComponent(query)}`)
    }
  }

  const placeholder = lang === 'tr' ? 'Ürün ara... (örn: lastik parlatıcı, cila)' : 'Search products... (e.g. tire shine, polish)'

  return (
    <div ref={ref} className={`relative w-full ${large ? 'max-w-2xl' : 'max-w-md'}`}>
      <form onSubmit={handleSubmit}>
        <div className={`flex items-center gap-3 bg-white rounded-2xl shadow-lg ${large ? 'px-5 py-4' : 'px-4 py-2.5'} border border-white/20`}>
          <Search size={large ? 22 : 18} className="text-gray-400 flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => query.length >= 2 && setOpen(true)}
            placeholder={placeholder}
            className={`flex-1 outline-none text-gray-800 placeholder-gray-400 bg-transparent ${large ? 'text-base' : 'text-sm'}`}
          />
          {query && (
            <button type="button" onClick={() => { setQuery(''); setOpen(false) }}>
              <X size={16} className="text-gray-400 hover:text-gray-600" />
            </button>
          )}
          <button type="submit"
            className={`bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors flex-shrink-0 ${large ? 'px-5 py-2' : 'px-3 py-1.5 text-sm'}`}>
            {lang === 'tr' ? 'Ara' : 'Search'}
          </button>
        </div>
      </form>

      {/* Dropdown sonuçlar */}
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
          {results.map(p => {
            const name = lang === 'tr' ? p.name_tr : p.name_en
            const cat = p.category ? (lang === 'tr' ? p.category.name_tr : p.category.name_en) : ''
            return (
              <button key={p.id} onClick={() => handleSelect(p.id)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors text-left">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                  {p.image
                    ? <img src={p.image} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full bg-gray-200" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{name}</p>
                  {cat && <p className="text-xs text-gray-400">{cat}</p>}
                </div>
                <Search size={14} className="text-gray-300 flex-shrink-0" />
              </button>
            )
          })}
          <button onClick={() => { setOpen(false); navigate(`/urunler?q=${encodeURIComponent(query)}`) }}
            className="w-full px-4 py-2.5 text-sm text-blue-600 font-medium hover:bg-blue-50 transition-colors border-t border-gray-100 text-center">
            {lang === 'tr' ? `"${query}" için tüm sonuçları gör` : `See all results for "${query}"`}
          </button>
        </div>
      )}

      {open && query.length >= 2 && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 px-4 py-4 text-center text-sm text-gray-400 z-50">
          {lang === 'tr' ? 'Sonuç bulunamadı' : 'No results found'}
        </div>
      )}
    </div>
  )
}
