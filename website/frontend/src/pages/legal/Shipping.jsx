import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import useSEO from '../../hooks/useSEO'
import api from '../../api/axios'

export default function Shipping() {
  const { i18n } = useTranslation()
  const lang = i18n.language
  const [settings, setSettings] = useState({})
  useSEO({ title: lang === 'tr' ? 'Teslimat Bilgileri' : 'Shipping Information' })

  useEffect(() => {
    api.get('/settings').then(r => setSettings(r.data)).catch(() => {})
  }, [])

  const content = lang === 'tr' ? settings.shipping_tr : settings.shipping_en

  return (
    <div className="pt-16 min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-blue-900 to-blue-700 text-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold">{lang === 'tr' ? 'Teslimat Bilgileri' : 'Shipping Information'}</h1>
          <p className="text-blue-200 mt-2 text-sm">{lang === 'tr' ? 'Son güncelleme: Mayıs 2026' : 'Last updated: May 2026'}</p>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          {content ? (
            <div className="prose prose-gray max-w-none text-gray-700 leading-relaxed whitespace-pre-line">{content}</div>
          ) : (
            <div className="prose prose-gray max-w-none">
              <h2>{lang === 'tr' ? 'Teslimat Süresi' : 'Delivery Time'}</h2>
              <p>{lang === 'tr'
                ? 'Siparişiniz onaylandıktan sonra 3-7 iş günü içinde kargoya teslim edilir.'
                : 'Your order will be shipped within 3-7 business days after confirmation.'}</p>
              <h2>{lang === 'tr' ? 'Kargo Takibi' : 'Cargo Tracking'}</h2>
              <p>{lang === 'tr'
                ? 'Kargoya verildiğinde e-posta adresinize takip numarası gönderilir.'
                : 'A tracking number will be sent to your email when shipped.'}</p>
              <h2>{lang === 'tr' ? 'Teslimat Bölgesi' : 'Delivery Area'}</h2>
              <p>{lang === 'tr' ? 'Tüm Türkiye\'ye teslimat yapılmaktadır.' : 'Delivery is available throughout Turkey.'}</p>
              <p>{lang === 'tr' ? 'İletişim: info@laveskimya.com' : 'Contact: info@laveskimya.com'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
