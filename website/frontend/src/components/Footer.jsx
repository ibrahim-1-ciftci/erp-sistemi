import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function Footer() {
  const { t, i18n } = useTranslation()
  const year = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-gray-400 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">L</span>
              </div>
              <span className="text-white font-bold text-lg">Laves Kimya</span>
            </div>
            <p className="text-sm leading-relaxed">
              {i18n.language === 'tr'
                ? 'Profesyonel oto bakım ürünleri üreticisi.'
                : 'Professional automotive care products manufacturer.'}
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">{i18n.language === 'tr' ? 'Hızlı Bağlantılar' : 'Quick Links'}</h4>
            <div className="space-y-2 text-sm">
              <Link to="/" className="block hover:text-white transition-colors">{t('nav.home')}</Link>
              <Link to="/urunler" className="block hover:text-white transition-colors">{t('nav.products')}</Link>
              <Link to="/hakkimizda" className="block hover:text-white transition-colors">{t('nav.about')}</Link>
              <Link to="/iletisim" className="block hover:text-white transition-colors">{t('nav.contact')}</Link>
            </div>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">{t('contact.title')}</h4>
            <div className="space-y-2 text-sm">
              <p>info@laves.com</p>
              <p>laves.com</p>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-6 text-center text-sm">
          © {year} Laves Kimya. {t('footer.rights')}
        </div>
      </div>
    </footer>
  )
}
