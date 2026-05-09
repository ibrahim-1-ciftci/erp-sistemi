import React from 'react'
import { useTranslation } from 'react-i18next'
import { Truck, Package, Clock, MapPin } from 'lucide-react'
import useSEO from '../../hooks/useSEO'

export default function Shipping() {
  const { i18n } = useTranslation()
  const lang = i18n.language
  useSEO({ title: lang === 'tr' ? 'Teslimat Bilgileri' : 'Shipping Information' })

  const cards = lang === 'tr' ? [
    { icon: Clock, title: '3-7 İş Günü', desc: 'Sipariş onayından sonra standart teslimat süresi' },
    { icon: Truck, title: 'Kargo ile Teslimat', desc: 'Anlaşmalı kargo firmaları aracılığıyla güvenli teslimat' },
    { icon: MapPin, title: 'Türkiye Geneli', desc: 'Tüm Türkiye\'ye teslimat yapılmaktadır' },
    { icon: Package, title: 'Güvenli Paketleme', desc: 'Ürünler hasara karşı özel paketleme ile gönderilir' },
  ] : [
    { icon: Clock, title: '3-7 Business Days', desc: 'Standard delivery time after order confirmation' },
    { icon: Truck, title: 'Cargo Delivery', desc: 'Safe delivery through contracted cargo companies' },
    { icon: MapPin, title: 'All Turkey', desc: 'Delivery is made throughout Turkey' },
    { icon: Package, title: 'Safe Packaging', desc: 'Products are shipped with special packaging against damage' },
  ]

  return (
    <div className="pt-16 min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-blue-900 to-blue-700 text-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold">{lang === 'tr' ? 'Teslimat Bilgileri' : 'Shipping Information'}</h1>
          <p className="text-blue-200 mt-2 text-sm">{lang === 'tr' ? 'Son güncelleme: Mayıs 2026' : 'Last updated: May 2026'}</p>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {cards.map((c, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                <c.icon size={20} className="text-blue-600" />
              </div>
              <h3 className="font-bold text-gray-900 text-sm mb-1">{c.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 prose prose-gray max-w-none">
          {lang === 'tr' ? (
            <>
              <h2>Teslimat Süreci</h2>
              <p>Siparişiniz onaylandıktan sonra hazırlık süreci başlar. Ürünler, sipariş onayından itibaren 3-7 iş günü içinde kargoya teslim edilir.</p>

              <h2>Kargo Takibi</h2>
              <p>Siparişiniz kargoya verildiğinde, e-posta adresinize kargo takip numarası gönderilir. Bu numara ile kargonuzun durumunu takip edebilirsiniz.</p>

              <h2>Teslimat Adresi</h2>
              <p>Teslimat, sipariş sırasında belirttiğiniz adrese yapılır. Adres değişikliği için siparişiniz kargoya verilmeden önce bizimle iletişime geçiniz.</p>

              <h2>Kargo Ücreti</h2>
              <p>Kargo ücreti, sipariş tutarına ve teslimat bölgesine göre belirlenir. Belirli bir tutarın üzerindeki siparişlerde kargo ücretsizdir.</p>

              <h2>Hasarlı Teslimat</h2>
              <p>Ürünü teslim alırken hasar tespit ederseniz, kargo görevlisi eşliğinde tutanak tutunuz ve bizimle iletişime geçiniz.</p>

              <h2>Uluslararası Teslimat</h2>
              <p>Şu an yalnızca Türkiye içi teslimat yapılmaktadır. Uluslararası teslimat için lütfen bizimle iletişime geçiniz.</p>

              <h2>İletişim</h2>
              <p>Teslimat ile ilgili sorularınız için: <strong>info@laveskimya.com</strong></p>
            </>
          ) : (
            <>
              <h2>Delivery Process</h2>
              <p>After your order is confirmed, the preparation process begins. Products are shipped within 3-7 business days after order confirmation.</p>

              <h2>Cargo Tracking</h2>
              <p>When your order is shipped, a cargo tracking number is sent to your email address. You can track the status of your cargo with this number.</p>

              <h2>Delivery Address</h2>
              <p>Delivery is made to the address specified during the order. Please contact us before your order is shipped for address changes.</p>

              <h2>Shipping Fee</h2>
              <p>Shipping fee is determined based on order amount and delivery region. Shipping is free for orders above a certain amount.</p>

              <h2>Damaged Delivery</h2>
              <p>If you detect damage when receiving the product, please keep a record with the cargo officer and contact us.</p>

              <h2>International Delivery</h2>
              <p>Currently only domestic delivery within Turkey is available. Please contact us for international delivery.</p>

              <h2>Contact</h2>
              <p>For questions about delivery: <strong>info@laveskimya.com</strong></p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
