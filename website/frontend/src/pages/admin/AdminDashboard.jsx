import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, Tag, MessageSquare, Eye, TrendingUp, AlertCircle } from 'lucide-react'
import api from '../../api/axios'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ products: 0, active: 0, categories: 0, messages: 0, unread: 0 })
  const [recentMessages, setRecentMessages] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/products'),
      api.get('/categories'),
      api.get('/contact'),
    ]).then(([p, c, m]) => {
      setStats({
        products: p.data.length,
        active: p.data.filter(x => x.is_active).length,
        categories: c.data.length,
        messages: m.data.length,
        unread: m.data.filter(x => !x.is_read).length,
      })
      setRecentMessages(m.data.slice(0, 3))
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const cards = [
    { label: 'Toplam Ürün', value: stats.products, sub: `${stats.active} aktif`, icon: Package, color: 'blue', path: '/admin/products' },
    { label: 'Kategoriler', value: stats.categories, sub: 'kategori', icon: Tag, color: 'purple', path: '/admin/categories' },
    { label: 'Mesajlar', value: stats.messages, sub: stats.unread > 0 ? `${stats.unread} okunmamış` : 'tümü okundu', icon: MessageSquare, color: stats.unread > 0 ? 'red' : 'green', path: '/admin/messages' },
  ]

  const colorMap = {
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Genel Bakış</h1>
        <p className="text-gray-400 text-sm mt-1">Laves Kimya Admin Paneli</p>
      </div>

      {/* İstatistik kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {cards.map(card => (
          <button key={card.label} onClick={() => navigate(card.path)}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-left hover:shadow-md hover:-translate-y-0.5 transition-all group">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[card.color]}`}>
                <card.icon size={20} />
              </div>
              {card.color === 'red' && (
                <span className="flex items-center gap-1 text-xs text-red-500 font-medium">
                  <AlertCircle size={12} /> Dikkat
                </span>
              )}
            </div>
            <div className="text-3xl font-black text-gray-900 mb-1">
              {loading ? <div className="h-8 w-12 bg-gray-100 rounded animate-pulse" /> : card.value}
            </div>
            <div className="text-sm font-medium text-gray-700">{card.label}</div>
            <div className="text-xs text-gray-400 mt-0.5">{card.sub}</div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Son mesajlar */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">Son Mesajlar</h2>
            <button onClick={() => navigate('/admin/messages')}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium">
              Tümünü gör →
            </button>
          </div>
          {recentMessages.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">Henüz mesaj yok</p>
          ) : (
            <div className="space-y-3">
              {recentMessages.map(m => (
                <div key={m.id} className={`flex items-start gap-3 p-3 rounded-xl ${!m.is_read ? 'bg-blue-50' : 'bg-gray-50'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${!m.is_read ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                    {m.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900 truncate">{m.name}</span>
                      {!m.is_read && <span className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-gray-500 truncate">{m.message}</p>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {new Date(m.created_at).toLocaleDateString('tr-TR')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Hızlı işlemler */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-gray-900 mb-4">Hızlı İşlemler</h2>
          <div className="space-y-2">
            {[
              { label: 'Yeni Ürün Ekle', icon: Package, path: '/admin/products/new', color: 'bg-blue-600 hover:bg-blue-700 text-white' },
              { label: 'Kategori Ekle', icon: Tag, path: '/admin/categories', color: 'bg-purple-600 hover:bg-purple-700 text-white' },
              { label: 'Mesajları Gör', icon: MessageSquare, path: '/admin/messages', color: 'bg-gray-100 hover:bg-gray-200 text-gray-700' },
              { label: 'Siteyi Görüntüle', icon: Eye, path: '/', color: 'bg-gray-100 hover:bg-gray-200 text-gray-700', external: true },
            ].map(item => (
              <button key={item.label}
                onClick={() => item.external ? window.open('/', '_blank') : navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${item.color}`}>
                <item.icon size={16} />
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
