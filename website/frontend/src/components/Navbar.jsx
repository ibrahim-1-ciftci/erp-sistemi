import React, { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Menu, X, Search } from 'lucide-react'
import api from '../api/axios'

// Inline mini arama — navbar içinde kullanmak için
function NavSearch({ transparent }) {
  const { i18n } = useTranslation()
  const lang = i18n.language
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [allProducts, setAllProducts] = useState([])
  const ref = useRef(null)

  useEffect(() => {
    api.get('/products?active_only=true').then(r => setAllProducts(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return }
    const q = query.toLowerCase()
    setResults(
      allProducts.filter(p => {
        const name = (lang === 'tr' ? p.name_tr : p.name_en).toLowerCase()
        return name.includes(q)
      }).slice(0, 5)
    )
  }, [query, allProducts, lang])

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelect = id => {
    setQuery(''); setOpen(false)
    navigate(`/urun/${id}`)
  }

  const handleSubmit = e => {
    e.preventDefault()
    if (query.trim()) { setOpen(false); navigate(`/urunler?q=${encodeURIComponent(query)}`) }
  }

  const inputBg = transparent
    ? 'bg-white/10 border-white/20 text-white placeholder-white/50 focus:bg-white/20'
    : 'bg-gray-100 border-transparent text-gray-800 placeholder-gray-400 focus:bg-white focus:border-blue-300'

  return (
    <div ref={ref} className="relative hidden md:block">
      <form onSubmit={handleSubmit} className="flex items-center">
        <div className="relative">
          <Search size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 ${transparent ? 'text-white/60' : 'text-gray-400'}`} />
          <input
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
            placeholder={lang === 'tr' ? 'Ürün ara...' : 'Search...'}
            className={`pl-9 pr-4 py-1.5 rounded-xl border text-sm w-48 focus:w-64 transition-all duration-300 outline-none ${inputBg}`}
          />
        </div>
      </form>

      {open && results.length > 0 && (
        <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
          {results.map(p => {
            const name = lang === 'tr' ? p.name_tr : p.name_en
            const cat = p.category ? (lang === 'tr' ? p.category.name_tr : p.category.name_en) : ''
            return (
              <button key={p.id} onClick={() => handleSelect(p.id)}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 transition-colors text-left">
                <div className="w-9 h-9 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  {p.image ? <img src={p.image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-200" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{name}</p>
                  {cat && <p className="text-xs text-gray-400">{cat}</p>}
                </div>
              </button>
            )
          })}
          <button onClick={() => { setOpen(false); navigate(`/urunler?q=${encodeURIComponent(query)}`) }}
            className="w-full px-4 py-2 text-xs text-blue-600 font-medium hover:bg-blue-50 border-t border-gray-100 text-center">
            {lang === 'tr' ? 'Tüm sonuçları gör →' : 'See all results →'}
          </button>
        </div>
      )}
    </div>
  )
}

export default function Navbar() {
  const { t, i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()
  const isHome = location.pathname === '/'

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => { setOpen(false) }, [location])

  const links = [
    { to: '/', label: t('nav.home') },
    { to: '/urunler', label: t('nav.products') },
    { to: '/hakkimizda', label: t('nav.about') },
    { to: '/iletisim', label: t('nav.contact') },
  ]

  const toggleLang = () => i18n.changeLanguage(i18n.language === 'tr' ? 'en' : 'tr')

  // Ana sayfada scroll olmadığında transparent — ama artık her zaman okunabilir renkler
  const transparent = isHome && !scrolled && !open

  // Arka plan
  const bg = transparent
    ? 'bg-gray-950/70 backdrop-blur-md'   // Tamamen şeffaf yerine koyu yarı saydam
    : 'bg-white/95 backdrop-blur-md shadow-sm'

  const logoText = transparent ? 'text-white' : 'text-gray-900'
  const logoAccent = transparent ? 'text-blue-400' : 'text-blue-600'
  const linkColor = transparent ? 'text-gray-200 hover:text-white' : 'text-gray-600 hover:text-blue-600'
  const activeColor = transparent ? 'text-white font-semibold' : 'text-blue-600 font-semibold'
  const langBtn = transparent
    ? 'border-white/40 text-white hover:bg-white/15'
    : 'border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600'

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${bg}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30">
              <span className="text-white font-black text-sm">L</span>
            </div>
            <span className={`font-black text-xl transition-colors ${logoText}`}>
              Laves <span className={logoAccent}>Kimya</span>
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-6">
            {links.map(l => (
              <Link key={l.to} to={l.to}
                className={`text-sm transition-colors whitespace-nowrap ${location.pathname === l.to ? activeColor : linkColor}`}>
                {l.label}
              </Link>
            ))}
          </div>

          {/* Arama + Dil + Mobil */}
          <div className="flex items-center gap-3 ml-auto">
            <NavSearch transparent={transparent} />

            <button onClick={toggleLang}
              className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-colors flex-shrink-0 ${langBtn}`}>
              {i18n.language === 'tr' ? 'EN' : 'TR'}
            </button>

            <button className={`md:hidden p-1 transition-colors ${transparent ? 'text-white' : 'text-gray-700'}`}
              onClick={() => setOpen(!open)}>
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-3 space-y-1 shadow-lg">
          {links.map(l => (
            <Link key={l.to} to={l.to}
              className={`block py-2.5 text-sm font-medium ${location.pathname === l.to ? 'text-blue-600' : 'text-gray-700'}`}>
              {l.label}
            </Link>
          ))}
          {/* Mobil arama */}
          <div className="pt-2 border-t border-gray-100">
            <form onSubmit={e => {
              e.preventDefault()
              const q = e.target.q.value
              if (q) { setOpen(false); window.location.href = `/urunler?q=${encodeURIComponent(q)}` }
            }}>
              <div className="flex gap-2">
                <input name="q" placeholder={i18n.language === 'tr' ? 'Ürün ara...' : 'Search...'}
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <button type="submit" className="bg-blue-600 text-white px-3 py-2 rounded-xl text-sm">
                  <Search size={16} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </nav>
  )
}
