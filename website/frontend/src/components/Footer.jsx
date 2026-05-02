import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Phone, Mail, MapPin } from 'lucide-react'

export default function Footer() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const year = new Date().getFullYear()

  return (
    <footer className="bg-gray-950 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30">
                <span className="text-white font-black">L</span>
              </div>
              <span className="text-white font-black text-xl">Laves <span className="text-blue-500">Kimya</span></span>
            </div>
            <p className="text-sm leading-relaxed max-w-xs">
              {lang === 'tr'
                ? 'Profesyonel oto bakım ürünleri üreticisi. Kalite ve güvenilirlikte sektör lideri.'
                : 'Professional automotive care products manufacturer. Industry leader in quality and reliability.'}
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">{lang === 'tr' ? 'Sayfalar' : 'Pages'}</h4>
            <div className="space-y-2.5 text-sm">
              <Link to="/" className="block hover:text-white transition-colors">{t('nav.home')}</Link>
              <Link to="/urunler" className="block hover:text-white transition-colors">{t('nav.products')}</Link>
              <Link to="/hakkimizda" className="block hover:text-white transition-colors">{t('nav.about')}</Link>
              <Link to="/iletisim" className="block hover:text-white transition-colors">{t('nav.contact')}</Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">{t('contact.title')}</h4>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-blue-500 flex-shrink-0" />
                <span>info@laves.com</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-blue-500 flex-shrink-0" />
                <span>Türkiye</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-gray-600">
          <span>© {year} Laves Kimya. {t('footer.rights')}</span>
          <span className="text-gray-700">laves.com</span>
        </div>
      </div>
    </footer>
  )
}
