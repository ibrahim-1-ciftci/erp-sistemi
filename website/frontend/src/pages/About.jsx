import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Users, Factory, Star } from 'lucide-react'
import api from '../api/axios'

export default function About() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const [settings, setSettings] = useState({})

  useEffect(() => {
    api.get('/settings').then(r => setSettings(r.data)).catch(() => {})
  }, [])

  const about = lang === 'tr' ? settings.about_tr : settings.about_en

  const stats = [
    { icon: Factory, value: '30+', label: lang === 'tr' ? 'Ürün Çeşidi' : 'Product Types' },
    { icon: Star, value: '100%', label: lang === 'tr' ? 'Kalite Kontrol' : 'Quality Control' },
    { icon: Users, value: 'B2B', label: lang === 'tr' ? 'Kurumsal Satış' : 'Corporate Sales' },
  ]

  return (
    <div className="pt-16 min-h-screen">
      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-900 to-blue-700 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">{t('about.title')}</h1>
          <p className="text-blue-100 text-lg">Laves Kimya</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {stats.map((s, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                <s.icon size={22} className="text-blue-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{s.value}</div>
              <div className="text-sm text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>

        {/* About text */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {lang === 'tr' ? 'Biz Kimiz?' : 'Who Are We?'}
          </h2>
          <p className="text-gray-600 leading-relaxed text-lg">
            {about || (lang === 'tr'
              ? 'Laves Kimya, oto bakım ürünleri alanında kaliteli ve güvenilir çözümler sunan bir üretim firmasıdır.'
              : 'Laves Chemistry is a manufacturing company offering quality and reliable solutions in automotive care products.')}
          </p>
        </div>
      </div>
    </div>
  )
}
