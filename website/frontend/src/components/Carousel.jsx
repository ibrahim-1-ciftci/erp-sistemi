import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, Package } from 'lucide-react'
import api from '../api/axios'

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
          position: 'absolute', top: pos.top, left: pos.left,
          fontSize: pos.size, opacity: pos.opacity,
          transform: `rotate(${pos.rotate}deg)`,
          color: '#1e40af', fontWeight: 700, fontFamily: 'monospace', whiteSpace: 'nowrap',
        }}>
          {symbols[i % symbols.length]}
        </span>
      ))}
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
  const [cardWidth, setCardWidth] = useState(0)
  const [dragDelta, setDragDelta] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const timerRef = useRef(null)
  const trackRef = useRef(null)
  const dragStartX = useRef(null)
  const offsetRef = useRef(0)
  const maxOffsetRef = useRef(0)
  const cardWidthRef = useRef(0)
  const wasDraggingRef = useRef(false)
  const gap = 16

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
    const update = () => {
      const c = getCols()
      setCols(c)
      if (trackRef.current) {
        const w = (trackRef.current.offsetWidth - gap * (c - 1)) / c
        setCardWidth(w)
        cardWidthRef.current = w
      }
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [products])

  useEffect(() => {
    offsetRef.current = offset
  }, [offset])

  useEffect(() => {
    if (products.length <= cols) return
    timerRef.current = setInterval(() => {
      setOffset(o => {
        const max = Math.max(0, products.length - cols)
        return o >= max ? 0 : o + 1
      })
    }, 3500)
    return () => clearInterval(timerRef.current)
  }, [products, cols])

  if (products.length === 0) return null

  const maxOffset = Math.max(0, products.length - cols)
  maxOffsetRef.current = maxOffset

  // Snap position (px)
  const snapX = offset * (cardWidth + gap)
  // Live translate = snap + drag delta
  const translateX = snapX - dragDelta

  const startDrag = (clientX) => {
    clearInterval(timerRef.current)
    dragStartX.current = clientX
    wasDraggingRef.current = false
    setIsDragging(true)
    setDragDelta(0)
  }

  const moveDrag = (clientX) => {
    if (dragStartX.current === null) return
    const delta = clientX - dragStartX.current
    if (Math.abs(delta) > 5) wasDraggingRef.current = true
    setDragDelta(delta)
  }

  const endDrag = (clientX) => {
    if (dragStartX.current === null) return
    const delta = clientX - dragStartX.current
    const threshold = (cardWidthRef.current + gap) * 0.3

    if (delta < -threshold) {
      setOffset(o => Math.min(maxOffsetRef.current, o + 1))
    } else if (delta > threshold) {
      setOffset(o => Math.max(0, o - 1))
    }

    dragStartX.current = null
    setDragDelta(0)
    setIsDragging(false)
    // wasDraggingRef'i kısa süre sonra sıfırla — click handler'ın önce çalışması için
    setTimeout(() => { wasDraggingRef.current = false }, 50)
  }

  const goTo = (i) => { clearInterval(timerRef.current); setOffset(i) }
  const prev = () => { clearInterval(timerRef.current); setOffset(o => Math.max(0, o - 1)) }
  const next = () => { clearInterval(timerRef.current); setOffset(o => Math.min(maxOffset, o + 1)) }

  return (
    <section className="relative py-12 overflow-hidden select-none"
      style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 50%, #eff6ff 100%)' }}>
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

        {/* Track */}
        <div className="overflow-hidden" ref={trackRef}>
          <div
            className="flex"
            style={{
              gap: `${gap}px`,
              transform: `translateX(-${translateX}px)`,
              transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              cursor: isDragging ? 'grabbing' : 'grab',
              willChange: 'transform',
            }}
            onMouseDown={e => { e.preventDefault(); startDrag(e.clientX) }}
            onMouseMove={e => moveDrag(e.clientX)}
            onMouseUp={e => endDrag(e.clientX)}
            onMouseLeave={e => { if (isDragging) endDrag(e.clientX) }}
            onTouchStart={e => startDrag(e.touches[0].clientX)}
            onTouchMove={e => { e.preventDefault(); moveDrag(e.touches[0].clientX) }}
            onTouchEnd={e => endDrag(e.changedTouches[0].clientX)}
          >
            {products.map(p => {
              const name = lang === 'tr' ? p.name_tr : p.name_en
              const cat = p.category ? (lang === 'tr' ? p.category.name_tr : p.category.name_en) : ''
              return (
                <div
                  key={p.id}
                  onClick={() => { if (!wasDraggingRef.current) navigate(`/urun/${p.id}`) }}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow group border border-blue-50 flex-shrink-0"
                  style={{ width: cardWidth > 0 ? `${cardWidth}px` : `calc((100% - ${gap * (cols - 1)}px) / ${cols})` }}
                >
                  <div className="aspect-square bg-gradient-to-br from-blue-50 to-gray-50 overflow-hidden pointer-events-none">
                    {p.image ? (
                      <img src={p.image} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" draggable={false} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package size={40} className="text-blue-200" />
                      </div>
                    )}
                  </div>
                  <div className="p-3 pointer-events-none">
                    {cat && <p className="text-xs text-blue-500 font-medium mb-0.5">{cat}</p>}
                    <p className="font-bold text-gray-900 text-sm truncate group-hover:text-blue-600 transition-colors">{name}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Dots */}
        {maxOffset > 0 && (
          <div className="flex justify-center gap-1.5 mt-5">
            {Array.from({ length: maxOffset + 1 }).map((_, i) => (
              <button key={i} onClick={() => goTo(i)}
                className={`h-1.5 rounded-full transition-all ${i === offset ? 'bg-blue-600 w-6' : 'bg-blue-200 w-1.5'}`} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
