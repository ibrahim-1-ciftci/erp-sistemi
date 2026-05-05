import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, Package } from 'lucide-react'
import api from '../api/axios'

// Kimya temalı dekoratif arka plan
function ChemBg() {
  const symbols = ['H₂O', 'CO₂', 'NaOH', 'HCl', 'CH₄', 'O₂', 'H₂', 'NH₃', 'C₆H₆', 'SO₄', 'NO₃', 'Ca²⁺', 'Fe³⁺', 'pH', 'mol']
  const positions = [
    { top: '8%', left: '3%', size: 18, opacity: 0.12, rotate: -15 },
    { top: '15%', left: '18%', size: 14, opacity: 0.08, rotate: 10 },
    { top: '5%', left: '35%', size: 22, opacity: 0.1, rotate: -5 },
    { top: '20%', left: '52%', size: 16, opacity: 0.09, rotate: 20 },
    { top: '8%', left: '68%', size: 20, opacity: 0.11, rotate: -10 },
    { top: '18%', left: '82%', size: 14, opacity: 0.08, rotate: 15 },
    { top: '5%', left: '92%', size: 18, opacity: 0.1, rotate: -20 },
    { top: '60%', left: '5%', size: 16, opacity: 0.09, rotate: 12 },
    { top: '70%', left: '22%', size: 20, opacity: 0.1, rotate: -8 },
    { top: '65%', left: '42%', size: 14, opacity: 0.08, rotate: 18 },
    { top: '75%', left: '60%', size: 18, opacity: 0.11, rotate: -12 },
    { top: '62%', left: '75%', size: 22, opacity: 0.09, rotate: 5 },
    { top: '72%', left: '88%', size: 16, opacity: 0.1, rotate: -18 },
    { top: '40%', left: '1%', size: 12, opacity: 0.07, rotate: 8 },
    { top: '45%', left: '96%', size: 14, opacity: 0.08, rotate: -6 },
  ]
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
      {positions.map((pos, i) => (
        <span key={i} style={{
          position: 'absolute',
          top: pos.top,
          left: pos.left,
          fontSize: pos.size,
          opacity: pos.opacity,
          transform: `rotate(${pos.rotate}deg)`,
          color: '#1e40af',
          fontWeight: 700,
          fontFamily: 'monospace',
          whiteSpace: 'nowrap',
        }}>
          {symbols[i % symbols.length]}
        </span>
      ))}
      {/* Molekül bağ çizgileri */}
      <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.04 }}>
        <circle cx="10%" cy="30%" r="40" fill="none" stroke="#1e40af" strokeWidth="1.5" />
        <circle cx="10%" cy="30%" r="8" fill="#1e40af" />
        <circle cx="15%" cy="22%" r="5" fill="#1e40af" />
        <line x1="10%" y1="30%" x2="15%" y2="22%" stroke="#1e40af" strokeWidth="1.5" />
        <circle cx="5%" cy="22%" r="5" fill="#1e40af" />
        <line x1="10%" y1="30%" x2="5%" y2="22%" stroke="#1e40af" strokeWidth="1.5" />

        <circle cx="88%" cy="65%" r="35" fill="none" stroke="#1e40af" strokeWidth="1.5" />
        <circle cx="88%" cy="65%" r="7" fill="#1e40af" />
        <circle cx="93%" cy="58%" r="5" fill="#1e40af" />
        <line x1="88%" y1="65%" x2="93%" y2="58%" stroke="#1e40af" strokeWidth="1.5" />
        <circle cx="83%" cy="58%" r="5" fill="#1e40af" />
        <line x1="88%" y1="65%" x2="83%" y2="58%" stroke="#1e40af" strokeWidth="1.5" />
        <circle cx="88%" cy="73%" r="5" fill="#1e40af" />
        <line x1="88%" y1="65%" x2="88%" y2="73%" stroke="#1e40af" strokeWidth="1.5" />
      </svg>
    </div>
  )
}

export default function Carousel() {
  const { i18n } = useTranslation()
  const lang = i18n.language
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [offset, setOffset] = useState(0)
  const [cols, setCols] = useState(4)
  const timerRef = useRef(null)
  const dragStart = useRef(null)
  const isDragging = useRef(false)

  useEffect(() => {
    api.get('/products?active_only=true').then(r => setProducts(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    const getCols = () => {
      if (window.innerWidth < 640) return 1
      if (window.innerWidth < 768) return 2
      if (window.innerWidth < 1024) return 3
      return 4
    }
    setCols(getCols())
    const handler = () => setCols(getCols())
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  useEffect(() => {
    if (products.length <= cols) return
    timerRef.current = setInterval(() => {
      setOffset(o => {
        const max = Math.max(0, products.length - cols)
        return o >= max ? 0 : o + 1
      })
    }, 3000)
    return () => clearInterval(timerRef.current)
  }, [products, cols])

  if (products.length === 0) return null

  const maxOffset = Math.max(0, products.length - cols)
  const visible = products.slice(offset, offset + cols)

  const prev = () => { clearInterval(timerRef.current); setOffset(o => Math.max(0, o - 1)) }
  const next = () => { clearInterval(timerRef.current); setOffset(o => Math.min(maxOffset, o + 1)) }

  // Touch / Mouse drag handlers
  const onDragStart = (clientX) => {
    dragStart.current = clientX
    isDragging.current = false
  }
  const onDragEnd = (clientX) => {
    if (dragStart.current === null) return
    const diff = dragStart.current - clientX
    if (Math.abs(diff) > 40) {
      isDragging.current = true
      clearInterval(timerRef.current)
      if (diff > 0) setOffset(o => Math.min(maxOffset, o + 1))
      else setOffset(o => Math.max(0, o - 1))
    }
    dragStart.current = null
  }

  return (
    <section className="relative py-12 overflow-hidden" style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 50%, #eff6ff 100%)' }}>
      <ChemBg />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-blue-600 font-semibold text-xs uppercase tracking-widest mb-1">
              {lang === 'tr' ? 'Ürün Kataloğu' : 'Product Catalog'}
            </p>
            <h2 className="text-xl md:text-2xl font-black text-gray-900">
              {lang === 'tr' ? 'Öne Çıkan Ürünler' : 'Featured Products'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={prev} disabled={offset === 0}
              className="w-9 h-9 rounded-full bg-white border border-blue-100 shadow-sm flex items-center justify-center hover:bg-blue-50 disabled:opacity-30 transition-all">
              <ChevronLeft size={18} className="text-blue-600" />
            </button>
            <button onClick={next} disabled={offset >= maxOffset}
              className="w-9 h-9 rounded-full bg-white border border-blue-100 shadow-sm flex items-center justify-center hover:bg-blue-50 disabled:opacity-30 transition-all">
              <ChevronRight size={18} className="text-blue-600" />
            </button>
          </div>
        </div>

        {/* Kartlar */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 cursor-grab active:cursor-grabbing select-none"
          onMouseDown={e => onDragStart(e.clientX)}
          onMouseUp={e => onDragEnd(e.clientX)}
          onMouseLeave={() => { dragStart.current = null }}
          onTouchStart={e => onDragStart(e.touches[0].clientX)}
          onTouchEnd={e => onDragEnd(e.changedTouches[0].clientX)}
        >
          {visible.map(p => {
            const name = lang === 'tr' ? p.name_tr : p.name_en
            const cat = p.category ? (lang === 'tr' ? p.category.name_tr : p.category.name_en) : ''
            return (
              <div key={p.id}
                onClick={() => { if (!isDragging.current) navigate(`/urun/${p.id}`) }}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group border border-blue-50">
                <div className="aspect-square bg-gradient-to-br from-blue-50 to-gray-50 overflow-hidden">
                  {p.image ? (
                    <img src={p.image} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package size={40} className="text-blue-200" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  {cat && <p className="text-xs text-blue-500 font-medium mb-0.5">{cat}</p>}
                  <p className="font-bold text-gray-900 text-sm truncate group-hover:text-blue-600 transition-colors">{name}</p>
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
                className={`h-1.5 rounded-full transition-all ${i === offset ? 'bg-blue-600 w-6' : 'bg-blue-200 w-1.5'}`} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
