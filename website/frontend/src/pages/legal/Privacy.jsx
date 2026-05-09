import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import useSEO from '../../hooks/useSEO'
import api from '../../api/axios'

export default function Privacy() {
  const { i18n } = useTranslation()
  const lang = i18n.language
  const [settings, setSettings] = useState({})
  useSEO({ title: lang === 'tr' ? 'Gizlilik Politikası' : 'Privacy Policy' })

  useEffect(() => {
    api.get('/settings').then(r => setSettings(r.data)).catch(() => {})
  }, [])

  const content = lang === 'tr' ? settings.privacy_tr : settings.privacy_en

  return (
    <div className="pt-16 min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-blue-900 to-blue-700 text-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold">{lang === 'tr' ? 'Gizlilik Politikası' : 'Privacy Policy'}</h1>
          <p className="text-blue-200 mt-2 text-sm">{lang === 'tr' ? 'Son güncelleme: Mayıs 2026' : 'Last updated: May 2026'}</p>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          {content ? (
            <div className="prose prose-gray max-w-none text-gray-700 leading-relaxed whitespace-pre-line">{content}</div>
          ) : (
            <div className="prose prose-gray max-w-none">
              <h2>{lang === 'tr' ? '1. Kişisel Verilerin Toplanması' : '1. Collection of Personal Data'}</h2>
              <p>{lang === 'tr'
                ? 'Laves Kimya olarak, web sitemizi ziyaret ettiğinizde veya iletişim formunu doldurduğunuzda ad-soyad, e-posta adresi, telefon numarası ve mesajınızı toplayabiliriz.'
                : 'As Laves Chemistry, when you visit our website or fill out the contact form, we may collect your name, email address, phone number, and message.'}</p>
              <h2>{lang === 'tr' ? '2. Verilerin Kullanım Amacı' : '2. Purpose of Data Use'}</h2>
              <p>{lang === 'tr'
                ? 'Toplanan veriler yalnızca taleplerinize yanıt vermek, sipariş süreçlerini yönetmek ve yasal yükümlülükleri yerine getirmek amacıyla kullanılır.'
                : 'Collected data is used only to respond to your requests, manage order processes, and fulfill legal obligations.'}</p>
              <h2>{lang === 'tr' ? '3. Veri Güvenliği' : '3. Data Security'}</h2>
              <p>{lang === 'tr'
                ? 'Kişisel verileriniz SSL şifreleme ile korunmaktadır. Verileriniz üçüncü taraflarla paylaşılmaz.'
                : 'Your personal data is protected with SSL encryption. Your data is not shared with third parties.'}</p>
              <h2>{lang === 'tr' ? '4. İletişim' : '4. Contact'}</h2>
              <p>{lang === 'tr' ? 'Sorularınız için: info@laveskimya.com' : 'For questions: info@laveskimya.com'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
