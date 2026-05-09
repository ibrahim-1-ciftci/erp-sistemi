import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import useSEO from '../../hooks/useSEO'
import api from '../../api/axios'

export default function Returns() {
  const { i18n } = useTranslation()
  const lang = i18n.language
  const [settings, setSettings] = useState({})
  useSEO({ title: lang === 'tr' ? 'İade ve İptal Koşulları' : 'Return & Cancellation Policy' })

  useEffect(() => {
    api.get('/settings').then(r => setSettings(r.data)).catch(() => {})
  }, [])

  const content = lang === 'tr' ? settings.returns_tr : settings.returns_en

  return (
    <div className="pt-16 min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-blue-900 to-blue-700 text-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold">{lang === 'tr' ? 'İade ve İptal Koşulları' : 'Return & Cancellation Policy'}</h1>
          <p className="text-blue-200 mt-2 text-sm">{lang === 'tr' ? 'Son güncelleme: Mayıs 2026' : 'Last updated: May 2026'}</p>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          {content ? (
            <div className="prose prose-gray max-w-none text-gray-700 leading-relaxed whitespace-pre-line">{content}</div>
          ) : (
            <div className="prose prose-gray max-w-none">
              <h2>{lang === 'tr' ? 'İade Koşulları' : 'Return Conditions'}</h2>
              <p>{lang === 'tr'
                ? 'Ürünü teslim aldığınız tarihten itibaren 14 gün içinde iade talebinde bulunabilirsiniz. Ürün orijinal ambalajında, kullanılmamış ve hasarsız olmalıdır.'
                : 'You can request a return within 14 days from the date you received the product. The product must be in its original packaging, unused and undamaged.'}</p>
              <h2>{lang === 'tr' ? 'İptal Koşulları' : 'Cancellation Conditions'}</h2>
              <p>{lang === 'tr'
                ? 'Sipariş kargoya verilmeden önce iptal talebinde bulunabilirsiniz.'
                : 'You can request cancellation before the order is shipped.'}</p>
              <h2>{lang === 'tr' ? 'Para İadesi' : 'Refund'}</h2>
              <p>{lang === 'tr'
                ? 'Onaylanan iadelerde ödeme 5-10 iş günü içinde iade edilir.'
                : 'For approved returns, payment is refunded within 5-10 business days.'}</p>
              <p>{lang === 'tr' ? 'İletişim: info@laveskimya.com' : 'Contact: info@laveskimya.com'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
