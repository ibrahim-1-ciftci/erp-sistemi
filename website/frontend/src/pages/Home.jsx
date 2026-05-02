import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Shield, Award, Truck } from 'lucide-react'
import api from '../api/axios'
import ProductCard from '../components/ProductCard'

export default function Home() {
  const { t, i18n } = useTranslation()
  const [featured, setFeatured] = useState([])

  useEffect(() => {
    api.get('/products?active_only=true').then(r => setFeatured(r.data.slice(0, 6))).catch(() => {})
  }, [])

  const features = [
    { icon: Shield, title: i18n.language === 'tr' ? 'Kalite Güvencesi' : 'Quality Assurance', desc: i18n.language === 'tr' ? 'Tüm ürünlerimiz kalite kontrolünden geçer' : 'All products pass quality control' },
    { icon: Award, title: i18n.language === 'tr' ? 'Profesyonel Formül' : 'Professional Formula', desc: i18n.language === 'tr' ? 'Uzman kimyagerler tarafından geliştirildi' : 'Developed by expert chemists' },
    { icon: Truck, title: i18n.language === 'tr' ? 'Hızlı Teslimat' : 'Fast Delivery', desc: i18n.language === 'tr' ? 'Türkiye genelinde hızlı teslimat' : 'Fast delivery across Turkey' },
  ]

  return (
    <div className="pt-16">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-300 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 md:py-36">
          <div className="max-w-2xl">
            <span className="inline-block bg-blue-500/30 text-blue-100 text-xs font-semibold px-3 py-1 rounded-full mb-4 uppercase tracking-wider">
              Laves Kimya
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
              {t('hero.title')}
            </h1>
            <p className="text-lg md:text-xl text-blue-100 mb-8">
              {t('hero.subtitle')}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/urunler"
                className="inline-flex items-center gap-2 bg-white text-blue-700 font-semibold px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors">
                {t('hero.cta')} <ArrowRight size={18} />
              </Link>
              <Link to="/iletisim"
                className="inline-flex items-center gap-2 border-2 border-white/50 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/10 transition-colors">
                {t('hero.contact')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <f.icon size={22} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3>
                  <p className="text-sm text-gray-500">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      {featured.length > 0 && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{t('products.title')}</h2>
              <Link to="/urunler" className="text-blue-600 font-medium hover:underline flex items-center gap-1">
                {i18n.language === 'tr' ? 'Tümünü Gör' : 'View All'} <ArrowRight size={16} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-3xl mx-auto px-4 text-center text-white">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            {i18n.language === 'tr' ? 'Bizimle İletişime Geçin' : 'Get in Touch With Us'}
          </h2>
          <p className="text-blue-100 mb-8">
            {i18n.language === 'tr'
              ? 'Ürünlerimiz ve fiyatlarımız hakkında bilgi almak için bize ulaşın.'
              : 'Contact us for information about our products and pricing.'}
          </p>
          <Link to="/iletisim"
            className="inline-flex items-center gap-2 bg-white text-blue-700 font-semibold px-8 py-3 rounded-xl hover:bg-blue-50 transition-colors">
            {t('hero.contact')} <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  )
}
