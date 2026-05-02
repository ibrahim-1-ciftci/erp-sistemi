import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Menu, X } from 'lucide-react'

export default function Navbar() {
  const { t, i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const links = [
    { to: '/', label: t('nav.home') },
    { to: '/urunler', label: t('nav.products') },
    { to: '/hakkimizda', label: t('nav.about') },
    { to: '/iletisim', label: t('nav.contact') },
  ]

  const toggleLang = () => i18n.changeLanguage(i18n.language === 'tr' ? 'en' : 'tr')

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-md' : 'bg-white/90 backdrop-blur-sm'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">L</span>
            </div>
            <span className="font-bold text-xl text-gray-900">Laves <span className="text-blue-600">Kimya</span></span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {links.map(l => (
              <Link key={l.to} to={l.to}
                className={`text-sm font-medium transition-colors ${location.pathname === l.to ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}>
                {l.label}
              </Link>
            ))}
          </div>

          {/* Lang + mobile */}
          <div className="flex items-center gap-3">
            <button onClick={toggleLang}
              className="text-xs font-semibold px-3 py-1.5 rounded-full border border-gray-200 hover:border-blue-400 hover:text-blue-600 transition-colors">
              {i18n.language === 'tr' ? 'EN' : 'TR'}
            </button>
            <button className="md:hidden p-1" onClick={() => setOpen(!open)}>
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-3 space-y-1">
          {links.map(l => (
            <Link key={l.to} to={l.to} onClick={() => setOpen(false)}
              className={`block py-2 text-sm font-medium ${location.pathname === l.to ? 'text-blue-600' : 'text-gray-700'}`}>
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  )
}
