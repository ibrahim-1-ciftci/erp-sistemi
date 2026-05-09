import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CheckCircle, ArrowRight } from 'lucide-react'
import useSEO from '../hooks/useSEO'

export default function OrderSuccess() {
  const { i18n } = useTranslation()
  const lang = i18n.language
  useSEO({ title: lang === 'tr' ? 'Sipariş Alındı' : 'Order Received' })

  return (
    <div className="pt-16 min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} className="text-green-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          {lang === 'tr' ? 'Siparişiniz Alındı!' : 'Order Received!'}
        </h1>
        <p className="text-gray-500 mb-2">
          {lang === 'tr'
            ? 'Siparişiniz başarıyla oluşturuldu. En kısa sürede sizinle iletişime geçeceğiz.'
            : 'Your order has been successfully created. We will contact you as soon as possible.'}
        </p>
        <p className="text-sm text-gray-400 mb-8">
          {lang === 'tr'
            ? 'Havale ile ödeme yaptıysanız, açıklamaya adınızı ve sipariş numaranızı yazmayı unutmayın.'
            : 'If you paid by bank transfer, don\'t forget to write your name and order number in the description.'}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/urunler"
            className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-2xl transition-colors">
            {lang === 'tr' ? 'Alışverişe Devam Et' : 'Continue Shopping'} <ArrowRight size={16} />
          </Link>
          <Link to="/iletisim"
            className="inline-flex items-center justify-center gap-2 border border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600 font-semibold px-6 py-3 rounded-2xl transition-colors">
            {lang === 'tr' ? 'İletişim' : 'Contact'}
          </Link>
        </div>
      </div>
    </div>
  )
}
