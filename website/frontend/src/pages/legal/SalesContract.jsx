import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import useSEO from '../../hooks/useSEO'
import api from '../../api/axios'

export default function SalesContract() {
  const { i18n } = useTranslation()
  const lang = i18n.language
  const [settings, setSettings] = useState({})
  useSEO({ title: lang === 'tr' ? 'Mesafeli Satış Sözleşmesi' : 'Distance Sales Agreement' })

  useEffect(() => {
    api.get('/settings').then(r => setSettings(r.data)).catch(() => {})
  }, [])

  const content = lang === 'tr' ? settings.sales_contract_tr : settings.sales_contract_en

  return (
    <div className="pt-16 min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-blue-900 to-blue-700 text-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold">{lang === 'tr' ? 'Mesafeli Satış Sözleşmesi' : 'Distance Sales Agreement'}</h1>
          <p className="text-blue-200 mt-2 text-sm">{lang === 'tr' ? 'Son güncelleme: Mayıs 2026' : 'Last updated: May 2026'}</p>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          {content ? (
            <div className="prose prose-gray max-w-none text-gray-700 leading-relaxed whitespace-pre-line">{content}</div>
          ) : (
            <div className="prose prose-gray max-w-none">
              <h2>{lang === 'tr' ? 'MADDE 1 – TARAFLAR' : 'ARTICLE 1 – PARTIES'}</h2>
              <p><strong>{lang === 'tr' ? 'Satıcı:' : 'Seller:'}</strong> Laves Kimya — laveskimya.com</p>
              <p><strong>{lang === 'tr' ? 'Alıcı:' : 'Buyer:'}</strong> {lang === 'tr' ? 'Web sitesi üzerinden sipariş veren kişi/kurum' : 'The person/entity placing an order through the website'}</p>
              <h2>{lang === 'tr' ? 'MADDE 2 – KONU' : 'ARTICLE 2 – SUBJECT'}</h2>
              <p>{lang === 'tr'
                ? 'Bu sözleşme, laveskimya.com üzerinden verilen siparişlerin satışı ve teslimatına ilişkin tarafların hak ve yükümlülüklerini düzenler.'
                : 'This agreement regulates the rights and obligations of the parties regarding the sale and delivery of orders placed through laveskimya.com.'}</p>
              <h2>{lang === 'tr' ? 'MADDE 3 – TESLİMAT' : 'ARTICLE 3 – DELIVERY'}</h2>
              <p>{lang === 'tr' ? 'Ürünler sipariş onayından itibaren 3-7 iş günü içinde teslim edilir.' : 'Products are delivered within 3-7 business days after order confirmation.'}</p>
              <h2>{lang === 'tr' ? 'MADDE 4 – CAYMA HAKKI' : 'ARTICLE 4 – RIGHT OF WITHDRAWAL'}</h2>
              <p>{lang === 'tr'
                ? 'Alıcı, ürünü teslim aldığı tarihten itibaren 14 gün içinde cayma hakkını kullanabilir.'
                : 'The Buyer may exercise the right of withdrawal within 14 days from the date of receipt.'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
