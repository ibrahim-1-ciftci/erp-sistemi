import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Shield, Award, Truck, ChevronDown } from 'lucide-react'
import api from '../api/axios'
import ProductCard from '../components/ProductCard'

export default function Home() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const [featured, setFeatured] = useState([])
  const [settings, setSettings] = useState({})

  useEffect(() => {
    api.get('/products?active_only=true').then(r => setFeatured(r.data.slice(0, 6))).catch(() => {})
    api.get('/settings').then(r => setSettings(r.data)).catch(() => {})
  }, [])

  const features = [
    { icon: Shield, title: lang === 'tr' ? 'Kalite Güvencesi' : 'Quality Assurance', desc: lang === 'tr' ? 'Tüm ürünlerimiz sıkı kalite kontrolünden geçer' : 'All products pass strict quality control' },
    { icon: Award, title: lang === 'tr' ? 'Profesyonel Formül' : 'Professional Formula', desc: lang === 'tr' ? 'Uzman kimyagerler tarafından geliştirildi' : 'Developed by expert chemists' },
    { icon: Truck, title: lang === 'tr' ? 'Hızlı Teslimat' : 'Fast Delivery', desc: lang === 'tr' ? 'Türkiye genelinde hızlı ve güvenli teslimat' : 'Fast and safe delivery across Turkey' },
  ]

  return (
    <div className="pt-16">
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center bg-gray-950 overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-900/20 rounded-full blur-3xl" />
        </div>

        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-5"
          style={{backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)', backgroundSize: '50px 50px'}} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold px-4 py-2 rounded-full mb-6 uppercase tracking-widest">
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
              {settings.company_name || 'Laves Kimya'}
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-tight mb-6">
              {lang === 'tr' ? (
                <>Profesyonel <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Oto Bakım</span> Ürünleri</>
              ) : (
                <>Professional <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Auto Care</span> Products</>
              )}
            </h1>
            <p className="text-lg md:text-xl text-gray-400 mb-10 leading-relaxed max-w-xl">
              {lang === 'tr'
                ? 'Araçlarınız için en kaliteli bakım çözümleri. Kimya bilimi ile mükemmel sonuçlar.'
                : 'The highest quality care solutions for your vehicles. Perfect results with chemistry science.'}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/urunler"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-4 rounded-2xl transition-all hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25">
                {t('hero.cta')} <ArrowRight size={18} />
              </Link>
              <Link to="/iletisim"
                className="inline-flex items-center gap-2 border border-white/10 bg-white/5 hover:bg-white/10 text-white font-semibold px-8 py-4 rounded-2xl transition-all backdrop-blur-sm">
                {t('hero.contact')}
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/30 animate-bounce">
          <ChevronDown size={24} />
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-blue-600 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 gap-4 text-center text-white">
            <div>
              <div className="text-2xl md:text-3xl font-black">30+</div>
              <div className="text-blue-100 text-xs md:text-sm">{lang === 'tr' ? 'Ürün Çeşidi' : 'Product Types'}</div>
            </div>
            <div className="border-x border-blue-500">
              <div className="text-2xl md:text-3xl font-black">100%</div>
              <div className="text-blue-100 text-xs md:text-sm">{lang === 'tr' ? 'Kalite Kontrol' : 'Quality Control'}</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-black">B2B</div>
              <div className="text-blue-100 text-xs md:text-sm">{lang === 'tr' ? 'Kurumsal Satış' : 'Corporate Sales'}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">
              {lang === 'tr' ? 'Neden Laves Kimya?' : 'Why Laves Chemistry?'}
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              {lang === 'tr' ? 'Sektörde fark yaratan kalite ve güvenilirlik' : 'Quality and reliability that makes a difference in the industry'}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all group">
                <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <f.icon size={24} className="text-white" />
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      {featured.length > 0 && (
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-blue-600 font-semibold text-sm uppercase tracking-wider mb-2">{lang === 'tr' ? 'Katalog' : 'Catalog'}</p>
                <h2 className="text-3xl md:text-4xl font-black text-gray-900">{t('products.title')}</h2>
              </div>
              <Link to="/urunler" className="hidden md:inline-flex items-center gap-2 text-blue-600 font-semibold hover:gap-3 transition-all">
                {lang === 'tr' ? 'Tümünü Gör' : 'View All'} <ArrowRight size={16} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
            <div className="mt-8 text-center md:hidden">
              <Link to="/urunler" className="inline-flex items-center gap-2 text-blue-600 font-semibold">
                {lang === 'tr' ? 'Tümünü Gör' : 'View All'} <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-20 bg-gray-950 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            {lang === 'tr' ? 'Bizimle İletişime Geçin' : 'Get in Touch With Us'}
          </h2>
          <p className="text-gray-400 mb-8 text-lg">
            {lang === 'tr'
              ? 'Ürünlerimiz ve fiyatlarımız hakkında bilgi almak için bize ulaşın.'
              : 'Contact us for information about our products and pricing.'}
          </p>
          <Link to="/iletisim"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-4 rounded-2xl transition-all hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25">
            {t('hero.contact')} <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  )
}
