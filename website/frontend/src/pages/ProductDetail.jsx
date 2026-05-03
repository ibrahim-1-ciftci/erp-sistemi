import React, { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ChevronLeft, ChevronRight, MessageCircle, Package } from 'lucide-react'
import api from '../api/axios'

export default function ProductDetail() {
  const { id } = useParams()
  const { i18n, t } = useTranslation()
  const lang = i18n.language
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [settings, setSettings] = useState({})
  const [activeImg, setActiveImg] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/products/${id}`).then(r => { setProduct(r.data); setLoading(false) }).catch(() => navigate('/urunler'))
    api.get('/settings').then(r => setSettings(r.data)).catch(() => {})
  }, [id])

  if (loading) return (
    <div className="pt-16 min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!product) return null

  const name = lang === 'tr' ? product.name_tr : product.name_en
  const desc = lang === 'tr' ? product.description_tr : product.description_en
  const catName = product.category ? (lang === 'tr' ? product.category.name_tr : product.category.name_en) : ''
  const images = product.images?.length > 0 ? product.images : (product.image ? [product.image] : [])

  const whatsappNum = settings.whatsapp?.replace(/\D/g, '')
  const defaultMsg = lang === 'tr'
    ? `Merhaba, "${name}" ürünü hakkında bilgi almak istiyorum.`
    : `Hello, I would like to get information about the "${name}" product.`
  const whatsappMsg = (lang === 'tr' ? settings.whatsapp_message_tr : settings.whatsapp_message_en) || defaultMsg
  const whatsappUrl = whatsappNum ? `https://wa.me/${whatsappNum}?text=${encodeURIComponent(whatsappMsg)}` : null

  return (
    <div className="pt-16 min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-8">
          <Link to="/" className="hover:text-blue-600 transition-colors">{t('nav.home')}</Link>
          <span>/</span>
          <Link to="/urunler" className="hover:text-blue-600 transition-colors">{t('nav.products')}</Link>
          <span>/</span>
          <span className="text-gray-700 font-medium">{name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Görsel galerisi */}
          <div className="space-y-4">
            {/* Ana görsel */}
            <div className="aspect-square bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden relative group">
              {images.length > 0 ? (
                <img src={images[activeImg]} alt={name}
                  className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-3">
                  <Package size={64} />
                  <span className="text-sm">{t('products.noImage')}</span>
                </div>
              )}

              {/* Önceki/Sonraki */}
              {images.length > 1 && (
                <>
                  <button onClick={() => setActiveImg(i => (i - 1 + images.length) % images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 hover:bg-white rounded-full shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronLeft size={18} />
                  </button>
                  <button onClick={() => setActiveImg(i => (i + 1) % images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 hover:bg-white rounded-full shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight size={18} />
                  </button>
                  {/* Dots */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {images.map((_, i) => (
                      <button key={i} onClick={() => setActiveImg(i)}
                        className={`w-2 h-2 rounded-full transition-all ${i === activeImg ? 'bg-blue-600 w-4' : 'bg-gray-300'}`} />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnail'lar */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setActiveImg(i)}
                    className={`flex-shrink-0 w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all ${i === activeImg ? 'border-blue-600 shadow-md' : 'border-gray-100 hover:border-gray-300'}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Ürün bilgileri */}
          <div className="flex flex-col">
            {catName && (
              <span className="inline-flex self-start text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full mb-4">
                {catName}
              </span>
            )}

            <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">{name}</h1>

            {desc ? (
              <p className="text-gray-600 leading-relaxed text-base mb-8">{desc}</p>
            ) : (
              <p className="text-gray-400 italic mb-8">
                {lang === 'tr' ? 'Ürün açıklaması henüz eklenmemiş.' : 'Product description not added yet.'}
              </p>
            )}

            <div className="mt-auto space-y-3">
              {whatsappUrl && (
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-2xl transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-green-500/25 w-full">
                  <MessageCircle size={20} />
                  {lang === 'tr' ? 'WhatsApp ile Bilgi Al' : 'Get Info via WhatsApp'}
                </a>
              )}
              <Link to="/iletisim"
                className="flex items-center justify-center gap-2 border-2 border-gray-200 hover:border-blue-400 text-gray-700 hover:text-blue-600 font-semibold py-4 px-6 rounded-2xl transition-all w-full">
                {t('contact.title')}
              </Link>
              <button onClick={() => navigate(-1)}
                className="flex items-center justify-center gap-2 text-gray-400 hover:text-gray-600 text-sm py-2 w-full transition-colors">
                <ArrowLeft size={16} />
                {lang === 'tr' ? 'Geri Dön' : 'Go Back'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
