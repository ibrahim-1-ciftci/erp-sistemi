import React, { useEffect, useState } from 'react'
import { Trash2, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../api/axios'

export default function AdminMessages() {
  const [messages, setMessages] = useState([])

  const load = () => api.get('/contact').then(r => setMessages(r.data)).catch(() => {})
  useEffect(load, [])

  const markRead = async id => {
    await api.put(`/contact/${id}/read`)
    load()
  }

  const handleDelete = async id => {
    if (!confirm('Silmek istediğinize emin misiniz?')) return
    await api.delete(`/contact/${id}`)
    toast.success('Silindi')
    load()
  }

  const unread = messages.filter(m => !m.is_read).length

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-xl font-bold text-gray-900">Mesajlar</h1>
        {unread > 0 && (
          <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">{unread}</span>
        )}
      </div>

      <div className="space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-16 text-gray-400">Henüz mesaj yok.</div>
        )}
        {messages.map(m => (
          <div key={m.id} className={`bg-white rounded-2xl border shadow-sm p-5 ${m.is_read ? 'border-gray-100' : 'border-blue-200'}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-900">{m.name}</span>
                  {!m.is_read && <span className="w-2 h-2 bg-blue-500 rounded-full" />}
                </div>
                <div className="text-xs text-gray-400 mb-3">
                  {m.email} {m.phone && `· ${m.phone}`} · {new Date(m.created_at).toLocaleDateString('tr-TR')}
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{m.message}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {!m.is_read && (
                  <button onClick={() => markRead(m.id)} title="Okundu işaretle"
                    className="p-1.5 hover:bg-green-50 rounded-lg text-gray-400 hover:text-green-600 transition-colors">
                    <CheckCircle size={16} />
                  </button>
                )}
                <button onClick={() => handleDelete(m.id)}
                  className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
