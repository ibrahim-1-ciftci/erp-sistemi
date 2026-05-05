import React, { useEffect, useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'
import api from '../api/axios'

export default function BlogSlider() {
  const { i18n } = useTranslation()
  const lang = i18n.language
  const navigate = useNavigate()
  const [posts, setPosts] = useState([])
  const [current, setCurrent] = useState(0)
  const intervalRef = useRef(null)

  useEffect(() => {
    api.get('/blog?active_only=true').then(r => setPosts(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (posts.length <= 1) return
    intervalRef.current = setInterval(() => setCurrent(c => (c + 1) % Math.ceil(posts.length / visibleCount())), 4000)
    return () => clearInterval(intervalRef.current)
  }, [posts])

  const visibleCount = () => {
    if (typeof window === 'undefined') return 3
    if (window.innerWidth < 640) return 1
    if (window.innerWidth < 1024) return 2
    return 3
  }

  if (posts.length === 0) return null

  const vc = visibleCount()
  const totalPages = Math.ceil(posts.length / vc)
  const visible = posts.slice(current * vc, current * vc + vc)

  const prev = () => { clearInterval(intervalRef.current); setCurrent(c => (c - 1 + totalPages) % totalPages) }
  const next = () => { clearInterval(intervalRef.current); setCurrent(c => (c + 1) % totalPages) }

  const formatDate = (iso) => {
    if (!iso) return ''
    return new Date(iso).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-blue-600 font-semibold text-sm uppercase tracking-wider mb-1">
              {lang === 'tr' ? 'Blog' : 'Blog'}
            </p>
            <h2 className="text-2xl md:text-3xl font-black text-gray-900">
              {lang === 'tr' ? 'Güncel Haberler' : 'Latest News'}
            </h2>
          </div>
          <button onClick={() => navigate('/blog')}
            className="hidden md:flex items-center gap-1 text-blue-600 font-semibold hover:gap-2 transition-all text-sm">
            {lang === 'tr' ? 'Tümünü Gör' : 'View All'} <ArrowRight size={15} />
          </button>
        </div>

        {/* Slider */}
        <div className="relative">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {visible.map(post => {
              const title = lang === 'tr' ? post.title_tr : post.title_en
              const summary = lang === 'tr' ? post.summary_tr : post.summary_en
              return (
                <div key={post.id} onClick={() => navigate(`/blog/${post.id}`)}
                  className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group overflow-hidden">
                  <div className="aspect-video bg-gray-100 overflow-hidden">
                    {post.image ? (
                      <img src={post.image} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                        <span className="text-blue-300 text-4xl font-black">L</span>
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <p className="text-xs text-gray-400 mb-2">{formatDate(post.created_at)}</p>
                    <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">{title}</h3>
                    {summary && <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">{summary}</p>}
                    <div className="flex items-center gap-1 text-blue-600 text-sm font-semibold mt-3">
                      {lang === 'tr' ? 'Daha Fazlası' : 'Read More'} <ArrowRight size={14} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Navigasyon */}
          {totalPages > 1 && (
            <>
              <button onClick={prev}
                className="absolute -left-4 top-1/2 -translate-y-1/2 w-9 h-9 bg-white border border-gray-200 rounded-full shadow flex items-center justify-center hover:bg-blue-50 hover:border-blue-400 transition-colors">
                <ChevronLeft size={18} className="text-gray-600" />
              </button>
              <button onClick={next}
                className="absolute -right-4 top-1/2 -translate-y-1/2 w-9 h-9 bg-white border border-gray-200 rounded-full shadow flex items-center justify-center hover:bg-blue-50 hover:border-blue-400 transition-colors">
                <ChevronRight size={18} className="text-gray-600" />
              </button>
            </>
          )}
        </div>

        {/* Dots */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)}
                className={`h-2 rounded-full transition-all ${i === current ? 'bg-blue-600 w-6' : 'bg-gray-200 w-2'}`} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
