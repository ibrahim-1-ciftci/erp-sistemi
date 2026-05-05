import React, { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import api from '../api/axios'

export default function BlogDetail() {
  const { id } = useParams()
  const { i18n } = useTranslation()
  const lang = i18n.language
  const navigate = useNavigate()
  const [post, setPost] = useState(null)

  useEffect(() => {
    api.get(`/blog/${id}`).then(r => setPost(r.data)).catch(() => navigate('/blog'))
  }, [id])

  if (!post) return (
    <div className="pt-16 min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const title = lang === 'tr' ? post.title_tr : post.title_en
  const content = lang === 'tr' ? post.content_tr : post.content_en
  const formatDate = iso => new Date(iso).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US', { day: '2-digit', month: 'long', year: 'numeric' })

  return (
    <div className="pt-16 min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <button onClick={() => navigate('/blog')}
          className="flex items-center gap-2 text-gray-400 hover:text-gray-600 text-sm mb-8 transition-colors">
          <ArrowLeft size={16} /> {lang === 'tr' ? 'Blog\'a Dön' : 'Back to Blog'}
        </button>

        {post.image && (
          <div className="aspect-video rounded-3xl overflow-hidden mb-8 shadow-sm">
            <img src={post.image} alt={title} className="w-full h-full object-cover" />
          </div>
        )}

        <p className="text-sm text-gray-400 mb-3">{formatDate(post.created_at)}</p>
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-6">{title}</h1>

        {content ? (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
            <div className="text-gray-700 leading-relaxed whitespace-pre-line">{content}</div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 text-gray-400 text-center">
            {lang === 'tr' ? 'İçerik henüz eklenmemiş.' : 'Content not added yet.'}
          </div>
        )}
      </div>
    </div>
  )
}
