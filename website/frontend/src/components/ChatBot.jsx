import React, { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { X, Send, MessageCircle, Bot, Loader2 } from 'lucide-react'
import api from '../api/axios'

export default function ChatBot() {
  const { i18n } = useTranslation()
  const lang = i18n.language
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([]) // {role: 'user'|'assistant', content, id}
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showBubble, setShowBubble] = useState(true)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Karşılama mesajı
  useEffect(() => {
    if (open && messages.length === 0) {
      const welcome = lang === 'tr'
        ? 'Merhaba! 👋 Ben Laves Kimya\'nın AI asistanıyım. Ürünlerimiz, kullanım alanları veya sipariş hakkında her şeyi sorabilirsiniz.'
        : 'Hello! 👋 I\'m the AI assistant of Laves Chemistry. Ask me anything about our products, usage or orders.'
      setMessages([{ role: 'assistant', content: welcome, id: 1 }])
    }
    if (open) {
      setShowBubble(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = async (text) => {
    const q = text || input.trim()
    if (!q || loading) return
    setInput('')

    const userMsg = { role: 'user', content: q, id: Date.now() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setLoading(true)

    try {
      // Sadece role+content gönder (id backend'e gitmesin)
      const history = newMessages.map(m => ({ role: m.role, content: m.content }))
      const res = await api.post('/chat', { messages: history, lang })
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: res.data.reply,
        id: Date.now() + 1
      }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: lang === 'tr'
          ? 'Üzgünüm, şu an yanıt veremiyorum. Lütfen daha sonra tekrar deneyin. 🙏'
          : 'Sorry, I can\'t respond right now. Please try again later. 🙏',
        id: Date.now() + 1
      }])
    } finally {
      setLoading(false)
    }
  }

  const quickQuestions = lang === 'tr'
    ? ['Ürünleriniz neler?', 'Nasıl sipariş verebilirim?', 'İletişim bilgileri', 'Toplu satış yapıyor musunuz?']
    : ['What products do you have?', 'How can I order?', 'Contact information', 'Do you do bulk sales?']

  // Mesaj metnini formatla (** bold **, [link](url), satır sonları)
  const formatText = (text) => {
    return text.split('\n').map((line, i) => {
      // Markdown linklerini parse et: [text](/url)
      const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
      const parts = []
      let lastIndex = 0
      let match

      while ((match = linkRegex.exec(line)) !== null) {
        // Link öncesi metin
        if (match.index > lastIndex) {
          const before = line.substring(lastIndex, match.index)
          parts.push(...parseBold(before))
        }
        // Link
        parts.push(
          <a
            key={`link-${i}-${match.index}`}
            href={match[2]}
            onClick={(e) => { e.preventDefault(); navigate(match[2]) }}
            className="text-blue-600 hover:text-blue-700 underline font-medium cursor-pointer">
            {match[1]}
          </a>
        )
        lastIndex = match.index + match[0].length
      }

      // Kalan metin
      if (lastIndex < line.length) {
        parts.push(...parseBold(line.substring(lastIndex)))
      }

      return (
        <span key={i}>
          {parts.length > 0 ? parts : parseBold(line)}
          {i < text.split('\n').length - 1 && <br />}
        </span>
      )
    })
  }

  // Bold parse helper
  const parseBold = (text) => {
    const boldParts = text.split(/\*\*(.*?)\*\*/g)
    return boldParts.map((part, j) =>
      j % 2 === 1 ? <strong key={j}>{part}</strong> : part
    )
  }

  return (
    <>
      {/* Açma butonu */}
      {!open && (
        <div className="fixed bottom-24 right-6 z-50 flex flex-col items-end gap-2">
          {showBubble && (
            <div className="bg-white text-gray-700 text-xs font-medium px-3 py-2 rounded-2xl shadow-lg border border-gray-100 max-w-[160px] text-center animate-bounce">
              {lang === 'tr' ? 'Yardım lazım mı? 💬' : 'Need help? 💬'}
              <div className="absolute bottom-0 right-5 translate-y-1/2 w-2 h-2 bg-white border-r border-b border-gray-100 rotate-45" />
            </div>
          )}
          <button
            onClick={() => setOpen(true)}
            className="w-14 h-14 rounded-full shadow-xl flex items-center justify-center bg-gradient-to-br from-blue-700 to-blue-500 hover:scale-110 transition-transform">
            <MessageCircle size={26} className="text-white" />
          </button>
        </div>
      )}

      {/* Chat penceresi */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 flex flex-col bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden"
          style={{ height: '520px' }}>

          {/* Header */}
          <div className="bg-gradient-to-r from-blue-700 to-blue-500 px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
                <Bot size={18} className="text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-sm">Laves AI Asistan</p>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  <p className="text-blue-100 text-xs">
                    {lang === 'tr' ? 'Llama 3.3 · Çevrimiçi' : 'Llama 3.3 · Online'}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {messages.length > 1 && (
                <button
                  onClick={() => setMessages([])}
                  className="text-white/60 hover:text-white text-xs transition-colors px-2 py-1 rounded-lg hover:bg-white/10">
                  {lang === 'tr' ? 'Temizle' : 'Clear'}
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white transition-colors p-1">
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Mesajlar */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map(msg => (
              <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-700 to-blue-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Bot size={14} className="text-white" />
                  </div>
                )}
                <div className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-sm'
                    : 'bg-white text-gray-800 shadow-sm rounded-tl-sm border border-gray-100'
                }`}>
                  {formatText(msg.content)}
                </div>
              </div>
            ))}

            {/* Yazıyor animasyonu */}
            {loading && (
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-700 to-blue-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Bot size={14} className="text-white" />
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Hızlı sorular — sadece başta */}
          {messages.length <= 1 && !loading && (
            <div className="px-3 py-2 flex gap-2 overflow-x-auto bg-gray-50 border-t border-gray-100 flex-shrink-0">
              {quickQuestions.map(q => (
                <button key={q} onClick={() => sendMessage(q)}
                  className="flex-shrink-0 text-xs bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-full hover:border-blue-400 hover:text-blue-600 transition-colors whitespace-nowrap">
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 bg-white border-t border-gray-100 flex-shrink-0">
            <div className="flex items-center gap-2 bg-gray-50 rounded-2xl px-3 py-2 border border-gray-200 focus-within:border-blue-400 transition-colors">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder={lang === 'tr' ? 'Sorunuzu yazın...' : 'Type your question...'}
                disabled={loading}
                className="flex-1 text-sm outline-none bg-transparent text-gray-800 placeholder-gray-400 disabled:opacity-50" />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className="w-8 h-8 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 text-white rounded-xl flex items-center justify-center transition-colors flex-shrink-0">
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              </button>
            </div>
            <p className="text-center text-gray-300 text-xs mt-1.5">
              Powered by Groq · Llama 3.3 70B
            </p>
          </div>
        </div>
      )}
    </>
  )
}
