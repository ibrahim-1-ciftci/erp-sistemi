import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight } from 'lucide-react'
import api from '../api/axios'

export default function Blog() {
  const { i18n } = useTranslation()
  const lang = i18n.language
  const navigate = useNavigate()
  const [posts, setPosts] = useState([])

  useEffect(() => {
    api.get('/blog?active_only=true').then(r => setPosts(r.data)).catch(() => {})
  }, [])

  const formatDate = iso => new Date(iso).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US', { day: '2-digit', month: 'long', year: 'numeric' })

  return (
    <div className="pt-16 min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-blue-900 to-blue-700 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-2">{lang === 'tr' ? 'Blog' : 'Blog'}</h1>
          <p className="text-blue-100">{lang === 'tr' ? 'Güncel haberler ve makaleler' : 'Latest news and articles'}</p>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {posts.length === 0 ? (
          <div className="text-center py-20 text-gray-400">{lang === 'tr' ? 'Henüz yazı yok.' : 'No posts yet.'}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map(post => {
              const title = lang === 'tr' ? post.title_tr : post.title_en
              const summary = lang === 'tr' ? post.summary_tr : post.summary_en
              return (
                <div key={post.id} onClick={() => navigate(`/blog/${post.id}`)}
                  className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group overflow-hidden">
                  <div className="aspect-video bg-gray-100 overflow-hidden">
                    {post.image
                      ? <img src={post.image} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      : <div className="w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center"><span className="text-blue-300 text-4xl font-black">L</span></div>}
                  </div>
                  <div className="p-5">
                    <p className="text-xs text-gray-400 mb-2">{formatDate(post.created_at)}</p>
                    <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">{title}</h3>
                    {summary && <p className="text-sm text-gray-500 line-clamp-2">{summary}</p>}
                    <div className="flex items-center gap-1 text-blue-600 text-sm font-semibold mt-3">
                      {lang === 'tr' ? 'Devamını Oku' : 'Read More'} <ArrowRight size={14} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
