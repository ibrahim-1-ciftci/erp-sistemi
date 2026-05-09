import React from 'react'
import { useTranslation } from 'react-i18next'
import useSEO from '../../hooks/useSEO'

export default function SalesContract() {
  const { i18n } = useTranslation()
  const lang = i18n.language
  useSEO({ title: lang === 'tr' ? 'Mesafeli Satış Sözleşmesi' : 'Distance Sales Agreement' })

  return (
    <div className="pt-16 min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-blue-900 to-blue-700 text-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold">{lang === 'tr' ? 'Mesafeli Satış Sözleşmesi' : 'Distance Sales Agreement'}</h1>
          <p className="text-blue-200 mt-2 text-sm">{lang === 'tr' ? 'Son güncelleme: Mayıs 2026' : 'Last updated: May 2026'}</p>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 prose prose-gray max-w-none">
          {lang === 'tr' ? (
            <>
              <h2>MADDE 1 – TARAFLAR</h2>
              <p><strong>Satıcı:</strong> Laves Kimya<br />
              <strong>Web Sitesi:</strong> laveskimya.com<br />
              <strong>E-posta:</strong> info@laveskimya.com</p>
              <p><strong>Alıcı:</strong> Web sitesi üzerinden sipariş veren kişi/kurum</p>

              <h2>MADDE 2 – KONU</h2>
              <p>Bu sözleşme, Alıcı'nın Satıcı'ya ait laveskimya.com web sitesi üzerinden elektronik ortamda sipariş verdiği ürünlerin satışı ve teslimatına ilişkin olarak 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümleri gereğince tarafların hak ve yükümlülüklerini düzenler.</p>

              <h2>MADDE 3 – ÜRÜN BİLGİLERİ</h2>
              <p>Satışa konu ürünlerin temel özellikleri, fiyatları ve ödeme bilgileri web sitesinde yer almaktadır. Fiyatlara KDV dahildir.</p>

              <h2>MADDE 4 – ÖDEME</h2>
              <p>Ödeme, kredi kartı veya banka havalesi ile gerçekleştirilebilir. Kredi kartı ödemeleri 3D Secure güvenlik sistemi ile korunmaktadır.</p>

              <h2>MADDE 5 – TESLİMAT</h2>
              <p>Ürünler, sipariş onayından itibaren 3-7 iş günü içinde kargo ile teslim edilir. Teslimat adresi, sipariş sırasında belirtilen adrestir.</p>

              <h2>MADDE 6 – CAYMA HAKKI</h2>
              <p>Alıcı, ürünü teslim aldığı tarihten itibaren 14 gün içinde herhangi bir gerekçe göstermeksizin cayma hakkını kullanabilir. Cayma hakkı kullanımında ürün, orijinal ambalajında ve kullanılmamış olarak iade edilmelidir.</p>

              <h2>MADDE 7 – GARANTİ</h2>
              <p>Ürünler, üretim hatalarına karşı 2 yıl garanti kapsamındadır. Garanti, kullanım hatalarını kapsamaz.</p>

              <h2>MADDE 8 – UYUŞMAZLIK</h2>
              <p>Bu sözleşmeden doğan uyuşmazlıklarda Türkiye Cumhuriyeti mahkemeleri ve icra daireleri yetkilidir.</p>
            </>
          ) : (
            <>
              <h2>ARTICLE 1 – PARTIES</h2>
              <p><strong>Seller:</strong> Laves Chemistry<br />
              <strong>Website:</strong> laveskimya.com<br />
              <strong>Email:</strong> info@laveskimya.com</p>
              <p><strong>Buyer:</strong> The person/entity placing an order through the website</p>

              <h2>ARTICLE 2 – SUBJECT</h2>
              <p>This agreement regulates the rights and obligations of the parties regarding the sale and delivery of products ordered electronically by the Buyer through laveskimya.com.</p>

              <h2>ARTICLE 3 – PRODUCT INFORMATION</h2>
              <p>Basic features, prices, and payment information of products for sale are available on the website. Prices include VAT.</p>

              <h2>ARTICLE 4 – PAYMENT</h2>
              <p>Payment can be made by credit card or bank transfer. Credit card payments are protected by the 3D Secure security system.</p>

              <h2>ARTICLE 5 – DELIVERY</h2>
              <p>Products are delivered by cargo within 3-7 business days after order confirmation. Delivery is made to the address specified during the order.</p>

              <h2>ARTICLE 6 – RIGHT OF WITHDRAWAL</h2>
              <p>The Buyer may exercise the right of withdrawal within 14 days from the date of receipt of the product without giving any reason. The product must be returned in its original packaging and unused.</p>

              <h2>ARTICLE 7 – WARRANTY</h2>
              <p>Products are covered by a 2-year warranty against manufacturing defects. The warranty does not cover usage errors.</p>

              <h2>ARTICLE 8 – DISPUTES</h2>
              <p>Turkish courts and enforcement offices are competent for disputes arising from this agreement.</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
