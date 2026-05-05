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
  const [current, setCurrent] = useState(0)
  const timerRef = useRef(null)

  useEffect(() => {
    api.get('/products?active_only=true').then(r => setProducts(r.data)).catch(() => {})
  }, [])

  const startTimer = () => {
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setCurrent(c => (c + 1) % Math.max(1, products.length))
    }, 3500)
  }

  useEffect(() => {
    if (products.length > 1) startTimer()
    return () => clearInterval(timerRef.current)
  }, [products])

  if (products.length === 0) return null

  const prev = () => {
    clearInterval(timerRef.current)
    setCurrent(c => (c - 1 + products.length) % products.length)
    startTimer()
  }

  const next = () => {
    clearInterval(timerRef.current)
    setCurrent(c => (c + 1) % products.length)
    startTimer()
  }

  const p = products[current]
  if (!p) return null

  const name = lang === 'tr' ? p.name_tr : p.name_en
  const desc = lang === 'tr' ? p.description_tr : p.description_en
  const cat = p.category ? (lang === 'tr' ? p.category.name_tr : p.category.name_en) : ''

  return (
    <section className="py-16 bg-gray-950 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <p className="text-blue-500 font-semibold text-sm uppercase tracking-widest mb-2">
            {lang === 'tr' ? 'Öne Çıkan Ürünler' : 'Featured Products'}
          </p>
          <h2 className="text-3xl md:text-4xl font-black text-white">
            {lang === 'tr' ? 'Ürün Vitrini' : 'Product Showcase'}
          </h2>
        </div>

        <div className="relative">
          {/* Ana kart */}
          <div className="flex flex-col md:flex-row items-center gap-8 bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12 backdrop-blur-sm min-h-[320px]">
            {/* Görsel */}
            <div className="w-full md:w-80 h-64 md:h-72 flex-shrink-0 rounded-2xl overflow-hidden bg-white/10 flex items-center justify-center">
              {p.image ? (
                <img src={p.image} alt={name} className="w-full h-full object-cover" />
              ) : (
                <Package size={64} className="text-white/20" />
              )}
            </div>

            {/* İçerik */}
            <div className="flex-1 text-center md:text-left">
              {cat && (
                <span className="inline-block bg-blue-500/20 text-blue-400 text-xs font-semibold px-3 py-1 rounded-full mb-4 uppercase tracking-wider">
                  {cat}
                </span>
              )}
              <h3 className="text-2xl md:text-3xl font-black text-white mb-4">{name}</h3>
              {desc && <p className="text-gray-400 leading-relaxed mb-6 max-w-lg">{desc}</p>}
              <button onClick={() => navigate(`/urun/${p.id}`)}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-2xl transition-all hover:scale-105">
                {lang === 'tr' ? 'Detayları Gör' : 'View Details'}
              </button>
            </div>
          </div>

          {/* Önceki/Sonraki */}
          {products.length > 1 && (
            <>
              <button onClick={prev}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-10 h-10 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full flex items-center justify-center text-white transition-all">
                <ChevronLeft size={20} />
              </button>
              <button onClick={next}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-10 h-10 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full flex items-center justify-center text-white transition-all">
                <ChevronRight size={20} />
              </button>
            </>
          )}
        </div>

        {/* Dots */}
        {products.length > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            {products.map((_, i) => (
              <button key={i} onClick={() => { clearInterval(timerRef.current); setCurrent(i); startTimer() }}
                className={`h-1.5 rounded-full transition-all ${i === current ? 'bg-blue-500 w-8' : 'bg-white/20 w-1.5'}`} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
