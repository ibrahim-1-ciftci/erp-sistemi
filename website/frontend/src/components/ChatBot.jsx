import React, { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { X, Send, MessageCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

export default function ChatBot() {
  const { i18n } = useTranslation()
  const lang = i18n.language
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [products, setProducts] = useState([])
  const messagesEndRef = useRef(null)

  useEffect(() => {
    api.get('/products?active_only=true').then(r => setProducts(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (open && messages.length === 0) {
      const welcome = lang === 'tr'
        ? 'Merhaba! 👋 Ben Laves Kimya asistanıyım. Ürün aramak için ürün adını yazabilirsiniz.'
        : 'Hello! 👋 I\'m the Laves Chemistry assistant. Type a product name to search.'
      setTimeout(() => setMessages([{ from: 'bot', text: welcome, id: 1 }]), 300)
    }
  }, [open, lang])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const addBot = (text, prods = []) => {
    setMessages(prev => [...prev, { from: 'bot', text, products: prods, id: Date.now() }])
  }

  const processQuery = (q) => {
    const lower = q.toLowerCase()
    if (['merhaba', 'selam', 'hello', 'hi'].some(w => lower.includes(w))) {
      addBot(lang === 'tr' ? 'Merhaba! 😊 Nasıl yardımcı olabilirim?' : 'Hello! 😊 How can I help?')
      return
    }
    if (['iletişim', 'telefon', 'contact'].some(w => lower.includes(w))) {
      addBot(lang === 'tr' ? 'İletişim sayfamızdan bize ulaşabilirsiniz! 📞' : 'You can reach us via our contact page! 📞')
      return
    }
    const found = products.filter(p => {
      const name = (lang === 'tr' ? p.name_tr : p.name_en).toLowerCase()
      return name.includes(lower) || lower.split(' ').some(w => w.length > 2 && name.includes(w))
    }).slice(0, 4)

    if (found.length > 0) {
      addBot(lang === 'tr' ? `${found.length} ürün buldum:` : `Found ${found.length} product(s):`, found)
    } else {
      addBot(lang === 'tr' ? 'Ürün bulunamadı. Farklı bir arama deneyin. 🔍' : 'No products found. Try a different search. 🔍')
    }
  }

  const handleSend = () => {
    const q = input.trim()
    if (!q) return
    setMessages(prev => [...prev, { from: 'user', text: q, id: Date.now() }])
    setInput('')
    setTimeout(() => processQuery(q), 400)
  }

  const quickQuestions = lang === 'tr'
    ? ['Cila ürünleri', 'Temizlik', 'Lastik bakım', 'İletişim']
    : ['Polish products', 'Cleaning', 'Tire care', 'Contact']

  return (
    <>
      {/* Buton */}
      {!open && (
        <div className="fixed bottom-24 right-6 z-50">
          <button onClick={() => setOpen(true)}
            className="w-14 h-14 rounded-full shadow-xl flex items-center justify-center bg-gradient-to-br from-blue-700 to-blue-500 hover:scale-110 transition-transform">
            <MessageCircle size={26} className="text-white" />
          </button>
          <div className="absolute -top-10 right-0 bg-white text-gray-700 text-xs font-medium px-3 py-1.5 rounded-xl shadow-lg whitespace-nowrap border border-gray-100">
            {lang === 'tr' ? 'Yardım lazım mı? 💬' : 'Need help? 💬'}
            <div className="absolute bottom-0 right-4 translate-y-1/2 w-2 h-2 bg-white border-r border-b border-gray-100 rotate-45" />
          </div>
        </div>
      )}

      {/* Chat penceresi */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 flex flex-col bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden" style={{ height: '480px' }}>
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-700 to-blue-500 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-white font-black text-sm">L</span>
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
                {msg.from === 'bot' && (
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">L</div>
                )}
                <div className={`max-w-[80%] flex flex-col gap-1 ${msg.from === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                    msg.from === 'user' ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white text-gray-800 shadow-sm rounded-tl-sm border border-gray-100'
                  }`}>
                    {msg.text}
                  </div>
                  {msg.products && msg.products.length > 0 && (
                    <div className="space-y-1.5 w-full">
                      {msg.products.map(p => (
                        <button key={p.id} onClick={() => { setOpen(false); navigate(`/urun/${p.id}`) }}
                          className="w-full flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-3 py-2 hover:bg-blue-50 hover:border-blue-200 transition-all text-left shadow-sm">
                          <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            {p.image ? <img src={p.image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-200" />}
                          </div>
                          <span className="text-xs font-medium text-gray-800 truncate">
                            {lang === 'tr' ? p.name_tr : p.name_en}
                          </span>
                        </button>
                      ))}
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
              {quickQuestions.map(q => (
                <button key={q} onClick={() => {
                  setMessages(prev => [...prev, { from: 'user', text: q, id: Date.now() }])
                  setTimeout(() => processQuery(q), 400)
                }}
                  className="flex-shrink-0 text-xs bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-full hover:border-blue-400 hover:text-blue-600 transition-colors">
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 bg-white border-t border-gray-100">
            <div className="flex items-center gap-2 bg-gray-50 rounded-2xl px-3 py-2 border border-gray-200 focus-within:border-blue-400 transition-colors">
              <input type="text" value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder={lang === 'tr' ? 'Mesaj yazın...' : 'Type a message...'}
                className="flex-1 text-sm outline-none bg-transparent text-gray-800 placeholder-gray-400" />
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
