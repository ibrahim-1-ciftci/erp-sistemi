import React, { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { X, Send } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

const BOT_AVATAR = (
  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 text-white text-sm font-bold">L</div>
)

export default function ChatBot() {
  const { i18n } = useTranslation()
  const lang = i18n.language
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [products, setProducts] = useState([])
  const [bounce, setBounce] = useState(true)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    api.get('/products?active_only=true').then(r => setProducts(r.data)).catch(() => {})
    const interval = setInterval(() => setBounce(b => !b), 3000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (open && messages.length === 0) {
      setTimeout(() => addBotMessage(
        lang === 'tr'
          ? 'Merhaba! 👋 Ben Laves Kimya asistanıyım. Size nasıl yardımcı olabilirim?\n\nÜrün aramak için ürün adını yazabilirsiniz.'
          : 'Hello! 👋 I\'m the Laves Chemistry assistant. How can I help you?\n\nYou can type a product name to search.'
      ), 400)
    }
  }, [open])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const addBotMessage = (text, productResults = []) => {
    setMessages(prev => [...prev, { from: 'bot', text, products: productResults, id: Date.now() }])
  }

  const handleSend = () => {
    const q = input.trim()
    if (!q) return
    setMessages(prev => [...prev, { from: 'user', text: q, id: Date.now() }])
    setInput('')
    setTimeout(() => processQuery(q), 500)
  }

  const processQuery = (q) => {
    const lower = q.toLowerCase()

    // Selamlama
    if (['merhaba', 'selam', 'hello', 'hi', 'hey'].some(w => lower.includes(w))) {
      addBotMessage(lang === 'tr' ? 'Merhaba! 😊 Size nasıl yardımcı olabilirim?' : 'Hello! 😊 How can I help you?')
      return
    }

    // İletişim
    if (['iletişim', 'telefon', 'email', 'contact', 'ulaş'].some(w => lower.includes(w))) {
      addBotMessage(lang === 'tr'
        ? 'İletişim sayfamızdan bize ulaşabilirsiniz. WhatsApp üzerinden de yazabilirsiniz! 📞'
        : 'You can reach us through our contact page or via WhatsApp! 📞')
      return
    }

    // Ürün ara
    const found = products.filter(p => {
      const name = (lang === 'tr' ? p.name_tr : p.name_en).toLowerCase()
      const desc = (lang === 'tr' ? p.description_tr : p.description_en || '').toLowerCase()
      return name.includes(lower) || lower.split(' ').some(word => word.length > 2 && (name.includes(word) || desc.includes(word)))
    }).slice(0, 4)

    if (found.length > 0) {
      addBotMessage(
        lang === 'tr' ? `"${q}" için ${found.length} ürün buldum:` : `Found ${found.length} product(s) for "${q}":`,
        found
      )
    } else {
      addBotMessage(
        lang === 'tr'
          ? `"${q}" için ürün bulamadım. Farklı bir arama deneyin veya ürün kataloğumuza göz atın. 🔍`
          : `No products found for "${q}". Try a different search or browse our catalog. 🔍`
      )
    }
  }

  return (
    <>
      {/* Chatbot butonu */}
      <div className="fixed bottom-24 right-6 z-50">
        {!open && (
          <div className="relative">
            {/* Konuşma balonu */}
            <div className="absolute -top-12 right-0 bg-white text-gray-700 text-xs font-medium px-3 py-1.5 rounded-xl shadow-lg whitespace-nowrap border border-gray-100 animate-bounce">
              {lang === 'tr' ? 'Size yardımcı olayım! 💬' : 'Let me help you! 💬'}
              <div className="absolute bottom-0 right-4 translate-y-1/2 w-2 h-2 bg-white border-r border-b border-gray-100 rotate-45" />
            </div>

            <button onClick={() => setOpen(true)}
              className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all hover:scale-110 ${bounce ? 'translate-y-0' : '-translate-y-1'}`}
              style={{ background: 'linear-gradient(135deg, #1e40af, #3b82f6)', transition: 'transform 0.5s ease-in-out' }}>
              {/* Kimyager robot SVG */}
              <svg viewBox="0 0 40 40" fill="none" className="w-9 h-9">
                {/* Kafa */}
                <rect x="10" y="6" width="20" height="16" rx="4" fill="white" opacity="0.9"/>
                {/* Gözler */}
                <circle cx="15" cy="13" r="2.5" fill="#3b82f6"/>
                <circle cx="25" cy="13" r="2.5" fill="#3b82f6"/>
                <circle cx="16" cy="12" r="1" fill="white"/>
                <circle cx="26" cy="12" r="1" fill="white"/>
                {/* Ağız */}
                <path d="M15 18 Q20 21 25 18" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                {/* Anten */}
                <line x1="20" y1="6" x2="20" y2="2" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="20" cy="2" r="1.5" fill="#fbbf24"/>
                {/* Boyun */}
                <rect x="17" y="22" width="6" height="3" rx="1" fill="white" opacity="0.7"/>
                {/* Gövde - önlük */}
                <rect x="8" y="25" width="24" height="12" rx="4" fill="white" opacity="0.85"/>
                <rect x="11" y="27" width="18" height="8" rx="2" fill="#dbeafe"/>
                {/* Önlük detay */}
                <rect x="18" y="27" width="4" height="8" rx="1" fill="#bfdbfe"/>
                {/* Kollar */}
                <rect x="2" y="25" width="7" height="4" rx="2" fill="white" opacity="0.7"/>
                <rect x="31" y="25" width="7" height="4" rx="2" fill="white" opacity="0.7"/>
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Chat penceresi */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 flex flex-col bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden"
          style={{ height: '480px' }}>
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-700 to-blue-500 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
                <svg viewBox="0 0 40 40" fill="none" className="w-7 h-7">
                  <rect x="10" y="6" width="20" height="16" rx="4" fill="white" opacity="0.9"/>
                  <circle cx="15" cy="13" r="2.5" fill="#3b82f6"/>
                  <circle cx="25" cy="13" r="2.5" fill="#3b82f6"/>
                  <circle cx="16" cy="12" r="1" fill="white"/>
                  <circle cx="26" cy="12" r="1" fill="white"/>
                  <path d="M15 18 Q20 21 25 18" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                  <line x1="20" y1="6" x2="20" y2="2" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                  <circle cx="20" cy="2" r="1.5" fill="#fbbf24"/>
                </svg>
              </div>
              <div>
                <p className="text-white font-bold text-sm">Laves Asistan</p>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                  <p className="text-blue-100 text-xs">{lang === 'tr' ? 'Çevrimiçi' : 'Online'}</p>
                </div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Mesajlar */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map(msg => (
              <div key={msg.id} className={`flex gap-2 ${msg.from === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {msg.from === 'bot' && BOT_AVATAR}
                <div className={`max-w-[80%] ${msg.from === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                  <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                    msg.from === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-sm'
                      : 'bg-white text-gray-800 shadow-sm rounded-tl-sm border border-gray-100'
                  }`}>
                    {msg.text}
                  </div>
                  {/* Ürün sonuçları */}
                  {msg.products && msg.products.length > 0 && (
                    <div className="space-y-1.5 w-full">
                      {msg.products.map(p => {
                        const name = lang === 'tr' ? p.name_tr : p.name_en
                        return (
                          <button key={p.id} onClick={() => { setOpen(false); navigate(`/urun/${p.id}`) }}
                            className="w-full flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-3 py-2 hover:bg-blue-50 hover:border-blue-200 transition-all text-left shadow-sm">
                            <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                              {p.image ? <img src={p.image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-200" />}
                            </div>
                            <span className="text-xs font-medium text-gray-800 truncate">{name}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Hızlı sorular */}
          {messages.length <= 1 && (
            <div className="px-3 py-2 flex gap-2 overflow-x-auto bg-gray-50 border-t border-gray-100">
              {(lang === 'tr'
                ? ['Cila ürünleri', 'Temizlik', 'Lastik bakım', 'İletişim']
                : ['Polish products', 'Cleaning', 'Tire care', 'Contact']
              ).map(q => (
                <button key={q} onClick={() => { setInput(q); setTimeout(() => processQuery(q), 100); setMessages(prev => [...prev, { from: 'user', text: q, id: Date.now() }]); setInput('') }}
                  className="flex-shrink-0 text-xs bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-full hover:border-blue-400 hover:text-blue-600 transition-colors">
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 bg-white border-t border-gray-100">
            <div className="flex items-center gap-2 bg-gray-50 rounded-2xl px-3 py-2 border border-gray-200 focus-within:border-blue-400 transition-colors">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder={lang === 'tr' ? 'Mesaj yazın...' : 'Type a message...'}
                className="flex-1 text-sm outline-none bg-transparent text-gray-800 placeholder-gray-400"
              />
              <button onClick={handleSend} disabled={!input.trim()}
                className="w-8 h-8 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 text-white rounded-xl flex items-center justify-center transition-colors flex-shrink-0">
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
