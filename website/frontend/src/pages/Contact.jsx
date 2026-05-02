import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Phone, Mail, MapPin, MessageCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api/axios'

export default function Contact() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const [settings, setSettings] = useState({})
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get('/settings').then(r => setSettings(r.data)).catch(() => {})
  }, [])

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/contact', form)
      toast.success(t('contact.success'))
      setForm({ name: '', email: '', phone: '', message: '' })
    } catch {
      toast.error(lang === 'tr' ? 'Bir hata oluştu.' : 'An error occurred.')
    } finally {
      setLoading(false)
    }
  }

  const whatsappNum = settings.whatsapp?.replace(/\D/g, '')
  const defaultMsg = lang === 'tr'
    ? 'Merhaba, ürünleriniz hakkında bilgi almak istiyorum.'
    : 'Hello, I would like to get information about your products.'
  const whatsappMsg = (lang === 'tr' ? settings.whatsapp_message_tr : settings.whatsapp_message_en) || defaultMsg
  const whatsappUrl = whatsappNum ? `https://wa.me/${whatsappNum}?text=${encodeURIComponent(whatsappMsg)}` : null

  return (
    <div className="pt-16 min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-blue-900 to-blue-700 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-2">{t('contact.title')}</h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Info */}
          <div className="space-y-4">
            {settings.phone && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Phone size={18} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">{lang === 'tr' ? 'Telefon' : 'Phone'}</p>
                  <p className="font-medium text-gray-900">{settings.phone}</p>
                </div>
              </div>
            )}
            {settings.email && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Mail size={18} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">{lang === 'tr' ? 'E-posta' : 'Email'}</p>
                  <p className="font-medium text-gray-900">{settings.email}</p>
                </div>
              </div>
            )}
            {settings.address && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <MapPin size={18} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">{t('contact.address')}</p>
                  <p className="font-medium text-gray-900">{settings.address}</p>
                </div>
              </div>
            )}
            {whatsappUrl && (
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
                className="bg-green-500 hover:bg-green-600 text-white rounded-2xl p-5 flex items-center gap-4 transition-colors">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <MessageCircle size={18} />
                </div>
                <span className="font-semibold">{t('contact.whatsapp')}</span>
              </a>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('contact.name')}</label>
              <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('contact.email')}</label>
              <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('contact.phone')}</label>
              <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('contact.message')}</label>
              <textarea required rows={4} value={form.message} onChange={e => setForm({...form, message: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60">
              {loading ? '...' : t('contact.send')}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
