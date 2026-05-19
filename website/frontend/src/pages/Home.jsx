import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Shield, Award, Truck, ChevronDown, Sparkles } from 'lucide-react'
import api from '../api/axios'
import ProductCard from '../components/ProductCard'
import Carousel from '../components/Carousel'
import ParticleCanvas from '../components/ParticleCanvas'
import useSEO from '../hooks/useSEO'

export default function Home() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const [featured, setFeatured] = useState([])
  const [settings, setSettings] = useState({})

  useSEO({
    url: '/',
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Laves Kimya",
      "url": "https://laveskimya.com",
      "logo": "https://laveskimya.com/webicon.png",
      "description": "Profesyonel oto bakım ve temizlik ürünleri üreticisi. Şanlıurfa Eyyübiye.",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Eyyüp Nebi, Şehit Uzman Çavuş Mehmet Gözcü Sokak No:82/B",
        "addressLocality": "Eyyübiye",
        "addressRegion": "Şanlıurfa",
        "postalCode": "63000",
        "addressCountry": "TR"
      },
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "customer service",
        "availableLanguage": ["Turkish", "English"]
      },
      "sameAs": []
    }
  })

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

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center bg-gray-950 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-blue-700/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute -bottom-32 -right-32 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1.5s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-blue-900/20 rounded-full blur-[100px]" />
        </div>
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(white 1px,transparent 1px),linear-gradient(90deg,white 1px,transparent 1px)', backgroundSize: '60px 60px' }} />
        <ParticleCanvas />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 w-full">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold px-4 py-2 rounded-full mb-8 uppercase tracking-widest">
              <Sparkles size={12} />
              {settings.company_name || 'Laves Kimya'}
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.05] mb-6">
              {lang === 'tr' ? (
                settings.hero_title_tr
                  ? <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-300">{settings.hero_title_tr}</span>
                  : <>Profesyonel<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-300">Oto Bakım</span><br />Ürünleri</>
              ) : (
                settings.hero_title_en
                  ? <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-300">{settings.hero_title_en}</span>
                  : <>Professional<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-300">Auto Care</span><br />Products</>
              )}
            </h1>
            <p className="text-gray-400 text-lg mb-8 leading-relaxed max-w-lg">
              {lang === 'tr'
                ? (settings.hero_subtitle_tr || 'Araçlarınız için en kaliteli bakım çözümleri. Kimya bilimi ile mükemmel sonuçlar.')
                : (settings.hero_subtitle_en || 'The highest quality care solutions for your vehicles. Perfect results with chemistry science.')}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/urunler" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-4 rounded-2xl transition-all hover:scale-105 hover:shadow-xl hover:shadow-blue-500/30 text-sm">
                {t('hero.cta')} <ArrowRight size={16} />
              </Link>
              <Link to="/iletisim" className="inline-flex items-center gap-2 border border-white/15 bg-white/5 hover:bg-white/10 text-white font-semibold px-8 py-4 rounded-2xl transition-all text-sm backdrop-blur-sm">
                {t('hero.contact')}
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/20 animate-bounce">
          <ChevronDown size={24} />
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="grid grid-cols-3 text-center text-white divide-x divide-blue-500">
            {[
              { val: settings.stats_1_val || '30+', label: lang === 'tr' ? (settings.stats_1_label_tr || 'Ürün Çeşidi') : 'Product Types' },
              { val: settings.stats_2_val || '100%', label: lang === 'tr' ? (settings.stats_2_label_tr || 'Kalite Kontrol') : 'Quality Control' },
              { val: settings.stats_3_val || 'B2B', label: lang === 'tr' ? (settings.stats_3_label_tr || 'Kurumsal Satış') : 'Corporate Sales' },
            ].map((s, i) => (
              <div key={i} className="py-1">
                <div className="text-2xl md:text-3xl font-black">{s.val}</div>
                <div className="text-blue-100 text-xs mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CAROUSEL ── */}
      <Carousel />

      {/* ── FEATURES ── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-blue-600 font-bold text-xs uppercase tracking-widest mb-3">
              {lang === 'tr' ? 'Neden Biz?' : 'Why Us?'}
            </p>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900">
              {lang === 'tr' ? 'Neden Laves Kimya?' : 'Why Laves Chemistry?'}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all group">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-400 rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                  <f.icon size={24} className="text-white" />
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FASON ÜRETİM ── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-blue-600 font-bold text-xs uppercase tracking-widest mb-3">
                {lang === 'tr' ? 'Fason Üretim' : 'Contract Manufacturing'}
              </p>
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-5 leading-tight">
                {lang === 'tr'
                  ? <>Kendi Markanızla<br /><span className="text-blue-600">Üretim Yapıyoruz</span></>
                  : <>We Produce<br /><span className="text-blue-600">Under Your Brand</span></>}
              </h2>
              <p className="text-gray-500 leading-relaxed mb-8">
                {lang === 'tr'
                  ? 'Laves Kimya olarak kendi ürün formüllerimizin yanı sıra müşterilerimize özel fason üretim hizmeti sunuyoruz. Markanıza özel etiket, ambalaj ve formülasyon ile profesyonel kimya ürünleri üretiyoruz.'
                  : 'In addition to our own product formulas, Laves Chemistry offers contract manufacturing services tailored to our customers. We produce professional chemical products with custom labels, packaging, and formulations for your brand.'}
              </p>
              <div className="space-y-3 mb-8">
                {(lang === 'tr'
                  ? ['Özel formülasyon geliştirme', 'Markanıza özel etiket ve ambalaj', 'Minimum sipariş esnekliği', 'Kalite kontrol ve sertifikasyon desteği']
                  : ['Custom formula development', 'Private label and packaging', 'Flexible minimum order quantities', 'Quality control and certification support']
                ).map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    <span className="text-gray-700 text-sm">{item}</span>
                  </div>
                ))}
              </div>
              <Link to="/iletisim" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3.5 rounded-2xl transition-all hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25 text-sm">
                {lang === 'tr' ? 'Teklif Alın' : 'Get a Quote'} <ArrowRight size={15} />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {(lang === 'tr'
                ? [
                    { emoji: '🧪', title: 'Formülasyon', desc: 'Uzman kimyagerlerimizle özel formül geliştirme' },
                    { emoji: '🏷️', title: 'Özel Etiket', desc: 'Markanıza özel tasarım ve baskı' },
                    { emoji: '📦', title: 'Ambalaj', desc: 'Farklı hacim ve ambalaj seçenekleri' },
                    { emoji: '✅', title: 'Kalite', desc: 'Her üretim partisi kalite kontrolünden geçer' },
                  ]
                : [
                    { emoji: '🧪', title: 'Formulation', desc: 'Custom formula development with expert chemists' },
                    { emoji: '🏷️', title: 'Private Label', desc: 'Custom design and printing for your brand' },
                    { emoji: '📦', title: 'Packaging', desc: 'Various volume and packaging options' },
                    { emoji: '✅', title: 'Quality', desc: 'Every production batch passes quality control' },
                  ]
              ).map((card, i) => (
                <div key={i} className="bg-gray-50 rounded-2xl p-5 border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all">
                  <div className="text-3xl mb-3">{card.emoji}</div>
                  <h4 className="font-bold text-gray-900 text-sm mb-1">{card.title}</h4>
                  <p className="text-gray-500 text-xs leading-relaxed">{card.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURED PRODUCTS ── */}
      {featured.length > 0 && (
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-blue-600 font-bold text-xs uppercase tracking-widest mb-2">
                  {lang === 'tr' ? 'Katalog' : 'Catalog'}
                </p>
                <h2 className="text-3xl md:text-4xl font-black text-gray-900">{t('products.title')}</h2>
              </div>
              <Link to="/urunler" className="hidden md:inline-flex items-center gap-1.5 text-blue-600 font-semibold text-sm hover:gap-3 transition-all">
                {lang === 'tr' ? 'Tümünü Gör' : 'View All'} <ArrowRight size={15} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
            <div className="mt-8 text-center md:hidden">
              <Link to="/urunler" className="inline-flex items-center gap-1.5 text-blue-600 font-semibold text-sm">
                {lang === 'tr' ? 'Tümünü Gör' : 'View All'} <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </section>
      )}

    </div>
  )
}
