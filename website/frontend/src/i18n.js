import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  tr: {
    translation: {
      nav: {
        home: 'Ana Sayfa', products: 'Ürünler', about: 'Hakkımızda', contact: 'İletişim'
      },
      hero: {
        title: 'Profesyonel Oto Bakım Ürünleri',
        subtitle: 'Araçlarınız için en kaliteli bakım çözümleri',
        cta: 'Ürünleri İncele', contact: 'İletişime Geç'
      },
      products: {
        title: 'Ürün Kataloğu', all: 'Tümü', noImage: 'Görsel Yok'
      },
      about: {
        title: 'Hakkımızda'
      },
      contact: {
        title: 'İletişim', name: 'Ad Soyad', email: 'E-posta',
        phone: 'Telefon', message: 'Mesajınız', send: 'Gönder',
        success: 'Mesajınız iletildi, teşekkürler!',
        address: 'Adres', whatsapp: 'WhatsApp ile Yaz'
      },
      footer: { rights: 'Tüm hakları saklıdır.' }
    }
  },
  en: {
    translation: {
      nav: {
        home: 'Home', products: 'Products', about: 'About', contact: 'Contact'
      },
      hero: {
        title: 'Professional Auto Care Products',
        subtitle: 'The highest quality care solutions for your vehicles',
        cta: 'View Products', contact: 'Get in Touch'
      },
      products: {
        title: 'Product Catalog', all: 'All', noImage: 'No Image'
      },
      about: {
        title: 'About Us'
      },
      contact: {
        title: 'Contact', name: 'Full Name', email: 'Email',
        phone: 'Phone', message: 'Your Message', send: 'Send',
        success: 'Your message has been sent, thank you!',
        address: 'Address', whatsapp: 'Chat on WhatsApp'
      },
      footer: { rights: 'All rights reserved.' }
    }
  }
}

i18n.use(initReactI18next).init({
  resources,
  lng: 'tr',
  fallbackLng: 'tr',
  interpolation: { escapeValue: false }
})

export default i18n
