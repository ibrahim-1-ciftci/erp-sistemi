import React, { useEffect, useState } from 'react'
import { Trash2, CheckCircle, Mail, Phone, MessageCircle, CheckCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../api/axios'

export default function AdminMessages() {
  const [messages, setMessages] = useState([])
  const [filter, setFilter] = useState('all') // all | unread | read

  const load = () => api.get('/contact').then(r => setMessages(r.data)).catch(() => {})
  useEffect(load, [])

  const markRead = async id => {
    await api.put(`/contact/${id}/read`).catch(() => {})
    load()
  }

  const markAllRead = async () => {
    const unread = messages.filter(m => !m.is_read)
    await Promise.all(unread.map(m => api.put(`/contact/${m.id}/read`).catch(() => {})))
    toast.success('Tümü okundu işaretlendi')
    load()
  }

  const handleDelete = async id => {
    if (!confirm('Silmek istediğinize emin misiniz?')) return
    await api.delete(`/contact/${id}`).catch(() => {})
    toast.success('Silindi')
    load()
  }

  const unread = messages.filter(m => !m.is_read).length
  const filtered = messages.filter(m => {
    if (filter === 'unread') return !m.is_read
    if (filter === 'read') return m.is_read
    return true
  })

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-gray-900">Mesajlar</h1>
          {unread > 0 && (
            <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">{unread} yeni</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unread > 0 && (
            <button onClick={markAllRead}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-1.5 rounded-xl hover:bg-gray-50 transition-colors">
              <CheckCheck size={13} /> Tümünü okundu işaretle
            </button>
          )}
        </div>
      </div>

      {/* Filtre */}
      <div className="flex gap-2 mb-4">
        {[
          { key: 'all', label: `Tümü (${messages.length})` },
          { key: 'unread', label: `Okunmamış (${unread})` },
          { key: 'read', label: `Okunmuş (${messages.length - unread})` },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${filter === f.key ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-400'}`}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100">
            {filter === 'unread' ? 'Okunmamış mesaj yok 🎉' : 'Mesaj yok'}
          </div>
        )}
        {filtered.map(m => (
          <div key={m.id}
            className={`bg-white rounded-2xl border shadow-sm p-5 transition-all ${!m.is_read ? 'border-blue-200 shadow-blue-50' : 'border-gray-100'}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${!m.is_read ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                  {m.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="font-semibold text-gray-900">{m.name}</span>
                    {!m.is_read && <span className="w-2 h-2 bg-blue-500 rounded-full" />}
                    <span className="text-xs text-gray-400 ml-auto">
                      {new Date(m.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                  {/* İletişim bilgileri */}
                  <div className="flex flex-wrap gap-3 mb-3">
                    {m.email && (
                      <a href={`mailto:${m.email}`} onClick={e => e.stopPropagation()}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700">
                        <Mail size={11} /> {m.email}
                      </a>
                    )}
                    {m.phone && (
                      <a href={`tel:${m.phone}`} onClick={e => e.stopPropagation()}
                        className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700">
                        <Phone size={11} /> {m.phone}
                      </a>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{m.message}</p>
                </div>
              </div>

              {/* Aksiyonlar */}
              <div className="flex flex-col gap-1.5 flex-shrink-0">
                {m.email && (
                  <a href={`mailto:${m.email}?subject=Re: Laves Kimya`}
                    className="flex items-center gap-1.5 text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 px-2.5 py-1.5 rounded-lg transition-colors">
                    <Mail size={12} /> Yanıtla
                  </a>
                )}
                {m.phone && (
                  <a href={`https://wa.me/${m.phone.replace(/\D/g, '')}?text=Merhaba ${m.name}, mesajınız için teşekkürler.`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs bg-green-50 hover:bg-green-100 text-green-600 px-2.5 py-1.5 rounded-lg transition-colors">
                    <MessageCircle size={12} /> WhatsApp
                  </a>
                )}
                {!m.is_read && (
                  <button onClick={() => markRead(m.id)}
                    className="flex items-center gap-1.5 text-xs bg-gray-50 hover:bg-gray-100 text-gray-500 px-2.5 py-1.5 rounded-lg transition-colors">
                    <CheckCircle size={12} /> Okundu
                  </button>
                )}
                <button onClick={() => handleDelete(m.id)}
                  className="flex items-center gap-1.5 text-xs bg-red-50 hover:bg-red-100 text-red-500 px-2.5 py-1.5 rounded-lg transition-colors">
                  <Trash2 size={12} /> Sil
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
