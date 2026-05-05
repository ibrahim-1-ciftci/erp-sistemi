import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, Package } from 'lucide-react'
import api from '../api/axios'

export default function Carousel() {
  const { i18n } = useTranslation()
  const lang = i18n.language
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [offset, setOffset] = useState(0)
  const timerRef = useRef(null)

  useEffect(() => {
    api.get('/products?active_only=true').then(r => setProducts(r.data)).catch(() => {})
  }, [])

  const visibleCount = () => {
    if (typeof window === 'undefined') return 4
    if (window.innerWidth < 640) return 1
    if (window.innerWidth < 768) return 2
    if (window.innerWidth < 1024) return 3
    return 4
  }

  const [cols, setCols] = useState(4)

  useEffect(() => {
    setCols(visibleCount())
    const handler = () => setCols(visibleCount())
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  useEffect(() => {
    if (products.length <= cols) return
    timerRef.current = setInterval(() => {
      setOffset(o => (o + 1) % (products.length - cols + 1))
    }, 3000)
    return () => clearInterval(timerRef.current)
  }, [products, cols])

  if (products.length === 0) return null

  const maxOffset = Math.max(0, products.length - cols)

  const prev = () => {
    clearInterval(timerRef.current)
    setOffset(o => Math.max(0, o - 1))
  }

  const next = () => {
    clearInterval(timerRef.current)
    setOffset(o => Math.min(maxOffset, o + 1))
  }

  const visible = products.slice(offset, offset + cols)

  return (
    <section className="py-12 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">
            {lang === 'tr' ? 'Öne Çıkan Ürünler' : 'Featured Products'}
          </h2>
          <div className="flex items-center gap-2">
            <button onClick={prev} disabled={offset === 0}
              className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-30 transition-all">
              <ChevronLeft size={16} className="text-gray-600" />
            </button>
            <button onClick={next} disabled={offset >= maxOffset}
              className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-30 transition-all">
              <ChevronRight size={16} className="text-gray-600" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {visible.map(p => {
            const name = lang === 'tr' ? p.name_tr : p.name_en
            return (
              <div key={p.id} onClick={() => navigate(`/urun/${p.id}`)}
                className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group">
                <div className="aspect-square bg-gray-50 overflow-hidden">
                  {p.image ? (
                    <img src={p.image} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package size={40} className="text-gray-200" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="font-semibold text-gray-900 text-sm truncate group-hover:text-blue-600 transition-colors">{name}</p>
                  {p.category && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {lang === 'tr' ? p.category.name_tr : p.category.name_en}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Dots */}
        {maxOffset > 0 && (
          <div className="flex justify-center gap-1.5 mt-5">
            {Array.from({ length: maxOffset + 1 }).map((_, i) => (
              <button key={i} onClick={() => { clearInterval(timerRef.current); setOffset(i) }}
                className={`h-1.5 rounded-full transition-all ${i === offset ? 'bg-blue-600 w-5' : 'bg-gray-200 w-1.5'}`} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
