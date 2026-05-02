import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Menu, X } from 'lucide-react'

export default function Navbar() {
  const { t, i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()
  const isHome = location.pathname === '/'

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 30)
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

  const transparent = isHome && !scrolled && !open
  const textColor = transparent ? 'text-white' : 'text-gray-700'
  const activColor = transparent ? 'text-blue-300' : 'text-blue-600'

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${transparent ? 'bg-transparent' : 'bg-white/95 backdrop-blur-md shadow-sm'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30">
              <span className="text-white font-black text-sm">L</span>
            </div>
            <span className={`font-black text-xl transition-colors ${transparent ? 'text-white' : 'text-gray-900'}`}>
              Laves <span className="text-blue-500">Kimya</span>
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {links.map(l => (
              <Link key={l.to} to={l.to}
                className={`text-sm font-medium transition-colors ${location.pathname === l.to ? activColor : `${textColor} hover:text-blue-500`}`}>
                {l.label}
              </Link>
            ))}
          </div>

          {/* Lang + mobile */}
          <div className="flex items-center gap-3">
            <button onClick={toggleLang}
              className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-colors ${transparent ? 'border-white/20 text-white hover:bg-white/10' : 'border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600'}`}>
              {i18n.language === 'tr' ? 'EN' : 'TR'}
            </button>
            <button className={`md:hidden p-1 ${textColor}`} onClick={() => setOpen(!open)}>
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
        </div>
      )}
    </nav>
  )
}
