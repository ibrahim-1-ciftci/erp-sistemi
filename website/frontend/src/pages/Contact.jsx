import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Phone, Mail, MapPin, MessageCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api/axios'
import useSEO from '../hooks/useSEO'

export default function Contact() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const [settings, setSettings] = useState({})
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' })
  const [loading, setLoading] = useState(false)

  useSEO({
    title: lang === 'tr' ? 'İletişim' : 'Contact',
    description: lang === 'tr'
      ? 'Laves Kimya ile iletişime geçin. Telefon, e-posta veya WhatsApp ile ulaşın.'
      : 'Contact Laves Chemistry. Reach us by phone, email or WhatsApp.',
  })

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

        {/* Harita */}
        <div className="mt-8 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <MapPin size={16} className="text-blue-600" />
            <span className="font-semibold text-gray-900 text-sm">
              {lang === 'tr' ? 'Konumumuz' : 'Our Location'}
            </span>
          </div>
          <iframe
            title="Laves Kimya Konum"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d12724.037696319363!2d38.79022015535664!3d37.12869081590371!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x153471076e20b7bd%3A0xbbcc02766cf01cfb!2sLaves%20Kimya!5e0!3m2!1str!2str!4v1778678230890!5m2!1str!2str"
            width="100%"
            height="380"
            style={{ border: 0, display: 'block' }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          <div className="px-6 py-3 bg-gray-50 text-xs text-gray-500 flex items-center gap-1.5">
            <MapPin size={12} />
            Eyyüp Nebi, Şehit Uzman Çavuş Mehmet Gözcü Sokak No:82/B, 63000 Eyyübiye/Şanlıurfa
          </div>
        </div>
      </div>
    </div>
  )
}
