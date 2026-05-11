import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Phone, Mail, MapPin, MessageCircle, ArrowUpRight } from 'lucide-react'
import api from '../api/axios'

export default function Footer() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const year = new Date().getFullYear()
  const [settings, setSettings] = useState({})
  const [categories, setCategories] = useState([])

  useEffect(() => {
    api.get('/settings').then(r => setSettings(r.data)).catch(() => {})
    api.get('/categories').then(r => setCategories(r.data.slice(0, 5))).catch(() => {})
  }, [])

  const whatsappNum = settings.whatsapp?.replace(/\D/g, '')
  const waMsg = lang === 'tr' ? 'Merhaba, ürünleriniz hakkında bilgi almak istiyorum.' : 'Hello, I would like to get information about your products.'

  return (
    <footer className="bg-gray-950 text-gray-400">
      {/* CTA band */}
      <div className="border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-white font-bold text-lg">
              {lang === 'tr' ? 'Toplu sipariş veya fiyat teklifi mi istiyorsunuz?' : 'Looking for bulk orders or a price quote?'}
            </p>
            <p className="text-gray-500 text-sm mt-0.5">
              {lang === 'tr' ? 'Hemen iletişime geçin, size özel fiyat sunalım.' : 'Contact us now for a custom price offer.'}
            </p>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            {whatsappNum && (
              <a href={`https://wa.me/${whatsappNum}?text=${encodeURIComponent(waMsg)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors">
                <MessageCircle size={16} /> WhatsApp
              </a>
            )}
            <Link to="/iletisim"
              className="flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors">
              {lang === 'tr' ? 'İletişim' : 'Contact'} <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">

          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30">
                <span className="text-white font-black">L</span>
              </div>
              <span className="text-white font-black text-xl">Laves <span className="text-blue-500">Kimya</span></span>
            </div>
            <p className="text-sm leading-relaxed text-gray-500">
              {lang === 'tr'
                ? 'Profesyonel oto bakım ürünleri üreticisi. Kalite ve güvenilirlikte sektör lideri.'
                : 'Professional automotive care products manufacturer. Industry leader in quality and reliability.'}
            </p>
          </div>

          {/* Kategoriler */}
          <div>
            <h4 className="text-white font-bold mb-4 text-xs uppercase tracking-widest">
              {lang === 'tr' ? 'Kategoriler' : 'Categories'}
            </h4>
            <div className="space-y-2.5 text-sm">
              {categories.map(c => (
                <Link key={c.id} to={`/urunler?cat=${c.id}`}
                  className="block hover:text-white hover:translate-x-1 transition-all">
                  {lang === 'tr' ? c.name_tr : c.name_en}
                </Link>
              ))}
              <Link to="/urunler" className="block text-blue-500 hover:text-blue-400 transition-colors text-xs mt-1">
                {lang === 'tr' ? 'Tüm ürünler →' : 'All products →'}
              </Link>
            </div>
          </div>

          {/* Sayfalar */}
          <div>
            <h4 className="text-white font-bold mb-4 text-xs uppercase tracking-widest">
              {lang === 'tr' ? 'Sayfalar' : 'Pages'}
            </h4>
            <div className="space-y-2.5 text-sm">
              <Link to="/" className="block hover:text-white hover:translate-x-1 transition-all">{t('nav.home')}</Link>
              <Link to="/urunler" className="block hover:text-white hover:translate-x-1 transition-all">{t('nav.products')}</Link>
              <Link to="/hakkimizda" className="block hover:text-white hover:translate-x-1 transition-all">{t('nav.about')}</Link>
              <Link to="/iletisim" className="block hover:text-white hover:translate-x-1 transition-all">{t('nav.contact')}</Link>
              <Link to="/iade-iptal" className="block hover:text-white hover:translate-x-1 transition-all">{lang === 'tr' ? 'İade & İptal' : 'Returns'}</Link>
              <Link to="/teslimat" className="block hover:text-white hover:translate-x-1 transition-all">{lang === 'tr' ? 'Teslimat' : 'Shipping'}</Link>
            </div>
          </div>

          {/* İletişim */}
          <div>
            <h4 className="text-white font-bold mb-4 text-xs uppercase tracking-widest">{t('contact.title')}</h4>
            <div className="space-y-3 text-sm">
              {settings.phone && (
                <a href={`tel:${settings.phone}`} className="flex items-center gap-2.5 hover:text-white transition-colors group">
                  <div className="w-7 h-7 bg-white/5 group-hover:bg-blue-600/20 rounded-lg flex items-center justify-center transition-colors">
                    <Phone size={13} className="text-blue-500" />
                  </div>
                  {settings.phone}
                </a>
              )}
              {settings.email && (
                <a href={`mailto:${settings.email}`} className="flex items-center gap-2.5 hover:text-white transition-colors group">
                  <div className="w-7 h-7 bg-white/5 group-hover:bg-blue-600/20 rounded-lg flex items-center justify-center transition-colors">
                    <Mail size={13} className="text-blue-500" />
                  </div>
                  {settings.email}
                </a>
              )}
              {settings.address && (
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 bg-white/5 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MapPin size={13} className="text-blue-500" />
                  </div>
                  <span className="text-xs leading-relaxed">{settings.address}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-gray-600">
          <span>© {year} Laves Kimya. {t('footer.rights')}</span>
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <Link to="/gizlilik-politikasi" className="hover:text-gray-400 transition-colors">
              {lang === 'tr' ? 'Gizlilik Politikası' : 'Privacy Policy'}
            </Link>
            <span>·</span>
            <Link to="/mesafeli-satis-sozlesmesi" className="hover:text-gray-400 transition-colors">
              {lang === 'tr' ? 'Satış Sözleşmesi' : 'Sales Agreement'}
            </Link>
            <span>·</span>
            <Link to="/iade-iptal" className="hover:text-gray-400 transition-colors">
              {lang === 'tr' ? 'İade & İptal' : 'Returns'}
            </Link>
            <span>·</span>
            <Link to="/teslimat" className="hover:text-gray-400 transition-colors">
              {lang === 'tr' ? 'Teslimat' : 'Shipping'}
            </Link>
          </div>
        </div>

        {/* Ödeme logoları */}
        <div className="mt-6 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600">{lang === 'tr' ? 'Güvenli ödeme yöntemleri' : 'Secure payment methods'}</p>
          <div className="flex items-center gap-3">
            {/* Visa */}
            <div className="bg-white rounded-md px-2 py-1 flex items-center justify-center h-8">
              <svg viewBox="0 0 60 20" width="48" height="16" xmlns="http://www.w3.org/2000/svg">
                <text x="0" y="16" fontFamily="Arial" fontWeight="bold" fontSize="16" fill="#1A1F71">VISA</text>
              </svg>
            </div>
            {/* Mastercard */}
            <div className="bg-white rounded-md px-2 py-1 flex items-center justify-center h-8">
              <svg viewBox="0 0 38 24" width="38" height="24" xmlns="http://www.w3.org/2000/svg">
                <circle cx="13" cy="12" r="10" fill="#EB001B"/>
                <circle cx="25" cy="12" r="10" fill="#F79E1B"/>
                <path d="M19 5.5a10 10 0 0 1 0 13A10 10 0 0 1 19 5.5z" fill="#FF5F00"/>
              </svg>
            </div>
            {/* Troy */}
            <div className="bg-white rounded-md px-2 py-1 flex items-center justify-center h-8">
              <svg viewBox="0 0 60 20" width="48" height="16" xmlns="http://www.w3.org/2000/svg">
                <text x="0" y="15" fontFamily="Arial" fontWeight="bold" fontSize="14" fill="#003087">troy</text>
              </svg>
            </div>
            {/* 3D Secure */}
            <div className="bg-white rounded-md px-2 py-1 flex items-center justify-center h-8 gap-1">
              <svg viewBox="0 0 16 16" width="14" height="14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 1L2 4v4c0 3.3 2.5 6.4 6 7 3.5-.6 6-3.7 6-7V4L8 1z" fill="#003087" stroke="#003087" strokeWidth="0.5"/>
                <path d="M6 8l1.5 1.5L10.5 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-xs font-bold text-gray-700">3D</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
