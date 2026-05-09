import React from 'react'
import { useTranslation } from 'react-i18next'
import useSEO from '../../hooks/useSEO'

export default function Privacy() {
  const { i18n } = useTranslation()
  const lang = i18n.language
  useSEO({ title: lang === 'tr' ? 'Gizlilik Politikası' : 'Privacy Policy' })

  return (
    <div className="pt-16 min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-blue-900 to-blue-700 text-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold">{lang === 'tr' ? 'Gizlilik Politikası' : 'Privacy Policy'}</h1>
          <p className="text-blue-200 mt-2 text-sm">{lang === 'tr' ? 'Son güncelleme: Mayıs 2026' : 'Last updated: May 2026'}</p>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 prose prose-gray max-w-none">
          {lang === 'tr' ? (
            <>
              <h2>1. Kişisel Verilerin Toplanması</h2>
              <p>Laves Kimya olarak, web sitemizi ziyaret ettiğinizde veya iletişim formunu doldurduğunuzda aşağıdaki kişisel verilerinizi toplayabiliriz: ad-soyad, e-posta adresi, telefon numarası ve mesajınız.</p>

              <h2>2. Verilerin Kullanım Amacı</h2>
              <p>Toplanan kişisel veriler yalnızca şu amaçlarla kullanılır:</p>
              <ul>
                <li>Taleplerinize yanıt vermek ve müşteri hizmetleri sağlamak</li>
                <li>Sipariş ve teslimat süreçlerini yönetmek</li>
                <li>Yasal yükümlülükleri yerine getirmek</li>
              </ul>

              <h2>3. Verilerin Paylaşımı</h2>
              <p>Kişisel verileriniz, yasal zorunluluklar dışında üçüncü taraflarla paylaşılmaz, satılmaz veya kiralanmaz.</p>

              <h2>4. Çerezler</h2>
              <p>Web sitemiz, kullanıcı deneyimini iyileştirmek amacıyla çerezler kullanabilir. Tarayıcı ayarlarınızdan çerezleri devre dışı bırakabilirsiniz.</p>

              <h2>5. Veri Güvenliği</h2>
              <p>Kişisel verileriniz SSL şifreleme teknolojisi ile korunmaktadır. Verilerinizin güvenliği için gerekli teknik ve idari tedbirler alınmaktadır.</p>

              <h2>6. Haklarınız</h2>
              <p>KVKK kapsamında kişisel verilerinize erişim, düzeltme, silme ve itiraz haklarına sahipsiniz. Bu haklarınızı kullanmak için <strong>info@laveskimya.com</strong> adresine başvurabilirsiniz.</p>

              <h2>7. İletişim</h2>
              <p>Gizlilik politikamız hakkında sorularınız için: <strong>info@laveskimya.com</strong></p>
            </>
          ) : (
            <>
              <h2>1. Collection of Personal Data</h2>
              <p>As Laves Chemistry, when you visit our website or fill out the contact form, we may collect the following personal data: name, email address, phone number, and your message.</p>

              <h2>2. Purpose of Data Use</h2>
              <p>Collected personal data is used only for the following purposes:</p>
              <ul>
                <li>Responding to your requests and providing customer service</li>
                <li>Managing order and delivery processes</li>
                <li>Fulfilling legal obligations</li>
              </ul>

              <h2>3. Data Sharing</h2>
              <p>Your personal data will not be shared, sold, or rented to third parties except as required by law.</p>

              <h2>4. Cookies</h2>
              <p>Our website may use cookies to improve user experience. You can disable cookies in your browser settings.</p>

              <h2>5. Data Security</h2>
              <p>Your personal data is protected with SSL encryption technology. Necessary technical and administrative measures are taken for the security of your data.</p>

              <h2>6. Your Rights</h2>
              <p>You have the right to access, correct, delete, and object to your personal data. To exercise these rights, you can contact <strong>info@laveskimya.com</strong>.</p>

              <h2>7. Contact</h2>
              <p>For questions about our privacy policy: <strong>info@laveskimya.com</strong></p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
