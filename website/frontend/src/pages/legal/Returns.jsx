import React from 'react'
import { useTranslation } from 'react-i18next'
import { RotateCcw, CheckCircle, XCircle, Clock } from 'lucide-react'
import useSEO from '../../hooks/useSEO'

export default function Returns() {
  const { i18n } = useTranslation()
  const lang = i18n.language
  useSEO({ title: lang === 'tr' ? 'İade ve İptal Koşulları' : 'Return & Cancellation Policy' })

  const steps = lang === 'tr' ? [
    { icon: Clock, title: '14 Gün İçinde', desc: 'Ürünü teslim aldığınız tarihten itibaren 14 gün içinde iade talebinde bulunabilirsiniz.' },
    { icon: CheckCircle, title: 'Orijinal Ambalaj', desc: 'Ürün, orijinal ambalajında, kullanılmamış ve hasarsız olmalıdır.' },
    { icon: RotateCcw, title: 'İade Süreci', desc: 'İade talebinizi info@laveskimya.com adresine bildirin. 2 iş günü içinde dönüş yapılır.' },
  ] : [
    { icon: Clock, title: 'Within 14 Days', desc: 'You can request a return within 14 days from the date you received the product.' },
    { icon: CheckCircle, title: 'Original Packaging', desc: 'The product must be in its original packaging, unused and undamaged.' },
    { icon: RotateCcw, title: 'Return Process', desc: 'Notify your return request to info@laveskimya.com. A response will be given within 2 business days.' },
  ]

  return (
    <div className="pt-16 min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-blue-900 to-blue-700 text-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold">{lang === 'tr' ? 'İade ve İptal Koşulları' : 'Return & Cancellation Policy'}</h1>
          <p className="text-blue-200 mt-2 text-sm">{lang === 'tr' ? 'Son güncelleme: Mayıs 2026' : 'Last updated: May 2026'}</p>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">

        {/* Adımlar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {steps.map((s, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                <s.icon size={22} className="text-blue-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{s.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 prose prose-gray max-w-none">
          {lang === 'tr' ? (
            <>
              <h2>İade Koşulları</h2>
              <p>Aşağıdaki koşullar sağlandığında iade kabul edilir:</p>
              <ul>
                <li>Ürün teslim tarihinden itibaren 14 gün içinde iade talebi oluşturulmuş olmalıdır</li>
                <li>Ürün orijinal ambalajında, kullanılmamış ve hasarsız olmalıdır</li>
                <li>Ürünle birlikte fatura/fiş ibraz edilmelidir</li>
              </ul>

              <h2>İade Kabul Edilmeyen Durumlar</h2>
              <div className="flex items-start gap-2 not-prose mb-2">
                <XCircle size={18} className="text-red-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-600">Açılmış, kullanılmış veya ambalajı bozulmuş ürünler</span>
              </div>
              <div className="flex items-start gap-2 not-prose mb-2">
                <XCircle size={18} className="text-red-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-600">14 günlük iade süresini geçmiş talepler</span>
              </div>
              <div className="flex items-start gap-2 not-prose mb-4">
                <XCircle size={18} className="text-red-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-600">Özel sipariş veya kişiye özel üretilen ürünler</span>
              </div>

              <h2>İptal Koşulları</h2>
              <p>Sipariş kargoya verilmeden önce iptal talebinde bulunabilirsiniz. Kargoya verildikten sonra iade prosedürü uygulanır.</p>

              <h2>Para İadesi</h2>
              <p>Onaylanan iadelerde ödeme, orijinal ödeme yöntemiyle 5-10 iş günü içinde iade edilir.</p>

              <h2>İletişim</h2>
              <p>İade ve iptal talepleriniz için: <strong>info@laveskimya.com</strong></p>
            </>
          ) : (
            <>
              <h2>Return Conditions</h2>
              <p>Returns are accepted when the following conditions are met:</p>
              <ul>
                <li>Return request must be created within 14 days from the delivery date</li>
                <li>Product must be in original packaging, unused and undamaged</li>
                <li>Invoice/receipt must be presented with the product</li>
              </ul>

              <h2>Non-Returnable Cases</h2>
              <div className="flex items-start gap-2 not-prose mb-2">
                <XCircle size={18} className="text-red-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-600">Opened, used or damaged packaging products</span>
              </div>
              <div className="flex items-start gap-2 not-prose mb-4">
                <XCircle size={18} className="text-red-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-600">Requests past the 14-day return period</span>
              </div>

              <h2>Cancellation Conditions</h2>
              <p>You can request cancellation before the order is shipped. After shipping, the return procedure applies.</p>

              <h2>Refund</h2>
              <p>For approved returns, payment is refunded via the original payment method within 5-10 business days.</p>

              <h2>Contact</h2>
              <p>For return and cancellation requests: <strong>info@laveskimya.com</strong></p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
