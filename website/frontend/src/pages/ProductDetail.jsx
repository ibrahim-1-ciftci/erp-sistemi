import React, { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ChevronLeft, ChevronRight, MessageCircle, Package, ZoomIn, X, Phone, ShoppingCart } from 'lucide-react'
import api from '../api/axios'
import useSEO from '../hooks/useSEO'
import { cartStore } from '../store/cartStore'

export default function ProductDetail() {
  const { id } = useParams()
  const { i18n, t } = useTranslation()
  const lang = i18n.language
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [settings, setSettings] = useState({})
  const [activeImg, setActiveImg] = useState(0)
  const [loading, setLoading] = useState(true)
  const [lightbox, setLightbox] = useState(false)
  const [addedToCart, setAddedToCart] = useState(false)
  const [selectedVariant, setSelectedVariant] = useState(null)

  const handleAddToCart = () => {
    const itemToAdd = selectedVariant
      ? { ...product, price: selectedVariant.price, variantLabel: selectedVariant.label }
      : product
    cartStore.addItem(itemToAdd)
    navigate('/sepet')
  }

  useEffect(() => {
    api.get(`/products/${id}`).then(r => {
      setProduct(r.data)
      setLoading(false)
      // Varyant varsa ilkini seç
      if (r.data.variants && r.data.variants.length > 0) {
        setSelectedVariant(r.data.variants[0])
        // İlk varyantın görseli varsa onu göster
        if (r.data.variants[0].image_url) {
          const imgIdx = (r.data.images || []).indexOf(r.data.variants[0].image_url)
          if (imgIdx >= 0) setActiveImg(imgIdx)
        }
      }
    }).catch(() => navigate('/urunler'))
    api.get('/settings').then(r => setSettings(r.data)).catch(() => {})
  }, [id])

  // Lightbox klavye navigasyonu
  useEffect(() => {
    if (!lightbox) return
    const handler = (e) => {
      if (e.key === 'Escape') setLightbox(false)
      if (e.key === 'ArrowRight') setActiveImg(i => (i + 1) % images.length)
      if (e.key === 'ArrowLeft') setActiveImg(i => (i - 1 + images.length) % images.length)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [lightbox])

  const name = product ? (lang === 'tr' ? product.name_tr : product.name_en) : ''
  const summary = product ? (lang === 'tr' ? product.description_tr : product.description_en) : ''
  const details = product ? (lang === 'tr' ? product.details_tr : product.details_en) : ''
  const catName = product?.category ? (lang === 'tr' ? product.category.name_tr : product.category.name_en) : ''
  const images = product?.images?.length > 0 ? product.images : (product?.image ? [product.image] : [])

  // JSON-LD Structured Data
  const firstVariant = product?.variants?.[0]
  const effectivePrice = firstVariant?.price_discounted || firstVariant?.price || product?.price
  const jsonLd = product ? {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": name,
    "description": summary ? summary.replace(/<[^>]*>/g, '').trim() : undefined,
    "image": images[0] ? (images[0].startsWith('http') ? images[0] : `https://laveskimya.com${images[0]}`) : undefined,
    "brand": { "@type": "Brand", "name": "Laves Kimya" },
    "manufacturer": {
      "@type": "Organization",
      "name": "Laves Kimya",
      "url": "https://laveskimya.com",
      "address": { "@type": "PostalAddress", "addressLocality": "Şanlıurfa", "addressCountry": "TR" }
    },
    "offers": product.variants && product.variants.length > 0
      ? product.variants.map(v => ({
          "@type": "Offer",
          "name": v.label,
          "price": v.price_discounted || v.price,
          "priceCurrency": "TRY",
          "availability": "https://schema.org/InStock",
          "url": `https://laveskimya.com/urun/${product.id}`,
          "seller": { "@type": "Organization", "name": "Laves Kimya" }
        }))
      : effectivePrice ? {
          "@type": "Offer",
          "price": effectivePrice,
          "priceCurrency": "TRY",
          "availability": "https://schema.org/InStock",
          "url": `https://laveskimya.com/urun/${product.id}`,
          "seller": { "@type": "Organization", "name": "Laves Kimya" }
        } : undefined
  } : undefined

  useSEO({
    title: name || undefined,
    description: summary || undefined,
    image: images[0] || undefined,
    url: `/urun/${id}`,
    jsonLd,
  })

  const whatsappNum = settings.whatsapp?.replace(/\D/g, '')
  const waMsg = lang === 'tr'
    ? `Merhaba, "${name}" ürünü hakkında bilgi ve fiyat almak istiyorum.`
    : `Hello, I would like to get information and pricing for the "${name}" product.`
  const whatsappUrl = whatsappNum ? `https://wa.me/${whatsappNum}?text=${encodeURIComponent(waMsg)}` : null

  if (loading) return (
    <div className="pt-16 min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!product) return null

  return (
    <div className="pt-16 min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-8">
          <Link to="/" className="hover:text-blue-600 transition-colors">{t('nav.home')}</Link>
          <span>/</span>
          <Link to="/urunler" className="hover:text-blue-600 transition-colors">{t('nav.products')}</Link>
          <span>/</span>
          <span className="text-gray-700 font-medium truncate max-w-[200px]">{name}</span>
        </div>

        {/* Üst bölüm */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-10">

          {/* Sol: Görsel galerisi */}
          <div className="space-y-4">
            <div className="aspect-square bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden relative group cursor-zoom-in"
              onClick={() => images.length > 0 && setLightbox(true)}>
              {images.length > 0 ? (
                <>
                  <img src={images[activeImg]} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute top-3 right-3 bg-black/40 text-white rounded-xl p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ZoomIn size={18} />
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-3">
                  <Package size={64} />
                  <span className="text-sm">{t('products.noImage')}</span>
                </div>
              )}
              {images.length > 1 && (
                <>
                  <button onClick={e => { e.stopPropagation(); setActiveImg(i => (i - 1 + images.length) % images.length) }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 hover:bg-white rounded-full shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronLeft size={18} />
                  </button>
                  <button onClick={e => { e.stopPropagation(); setActiveImg(i => (i + 1) % images.length) }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 hover:bg-white rounded-full shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight size={18} />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5" onClick={e => e.stopPropagation()}>
                    {images.map((_, i) => (
                      <button key={i} onClick={() => setActiveImg(i)}
                        className={`h-2 rounded-full transition-all ${i === activeImg ? 'bg-blue-600 w-4' : 'bg-gray-300 w-2'}`} />
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

          {/* Sağ: Özet + butonlar */}
          <div className="flex flex-col">
            {catName && (
              <span className="inline-flex self-start text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full mb-4">
                {catName}
              </span>
            )}
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-4 leading-tight">{name}</h1>

            {summary && (
              <div className="text-gray-600 leading-relaxed text-base mb-6 border-l-4 border-blue-100 pl-4 rich-content" dangerouslySetInnerHTML={{ __html: summary }} />
            )}

            {/* Varyant seçici — varsa göster */}
            {product.variants && product.variants.length > 0 && (
              <div className="mb-6">
                <p className="text-sm font-semibold text-gray-700 mb-2">
                  {lang === 'tr' ? 'Hacim / Miktar Seçin:' : 'Select Volume / Quantity:'}
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map(v => {
                    const hasDiscount = v.price_discounted && v.price_discounted < v.price
                    const displayPrice = hasDiscount ? v.price_discounted : v.price
                    return (
                      <button
                        key={v.id}
                        onClick={() => {
                          setSelectedVariant(v)
                          if (v.image_url) {
                            const idx = images.indexOf(v.image_url)
                            setActiveImg(idx >= 0 ? idx : 0)
                          }
                        }}
                        className={`px-4 py-2 rounded-xl border-2 text-sm font-semibold transition-all ${
                          selectedVariant?.id === v.id
                            ? 'border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-500/25'
                            : 'border-gray-200 text-gray-700 hover:border-blue-400 hover:text-blue-600'
                        }`}>
                        {v.label}
                        <span className={`ml-1.5 text-xs ${selectedVariant?.id === v.id ? 'text-blue-100' : 'text-gray-400'}`}>
                          ₺{displayPrice.toLocaleString('tr-TR')}
                        </span>
                      </button>
                    )
                  })}
                </div>

                {/* Seçili varyant fiyat detayı */}
                {selectedVariant && (
                  <div className="mt-3 p-4 bg-blue-50 rounded-xl">
                    <div className="flex items-end gap-3 flex-wrap">
                      {selectedVariant.price_discounted && selectedVariant.price_discounted < selectedVariant.price ? (
                        <>
                          <span className="text-3xl font-black text-blue-600">
                            {selectedVariant.price_discounted.toLocaleString('tr-TR')} ₺
                          </span>
                          <span className="text-lg text-gray-400 line-through">
                            {selectedVariant.price.toLocaleString('tr-TR')} ₺
                          </span>
                          <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg">
                            %{selectedVariant.discount_percent || Math.round((1 - selectedVariant.price_discounted / selectedVariant.price) * 100)} İNDİRİM
                          </span>
                        </>
                      ) : (
                        <span className="text-3xl font-black text-blue-600">
                          {selectedVariant.price.toLocaleString('tr-TR')} ₺
                        </span>
                      )}
                      <span className="text-sm text-gray-500 mb-1">/ {selectedVariant.label}</span>
                    </div>
                    {(lang === 'tr' ? selectedVariant.price_note_tr : selectedVariant.price_note_en) && (
                      <p className="text-xs text-gray-500 mt-1">
                        {lang === 'tr' ? selectedVariant.price_note_tr : selectedVariant.price_note_en}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Özellik rozetleri */}
            <div className="flex flex-wrap gap-2 mb-6">
              {[
                lang === 'tr' ? '✓ Profesyonel Formül' : '✓ Professional Formula',
                lang === 'tr' ? '✓ Kalite Kontrol' : '✓ Quality Control',
                lang === 'tr' ? '✓ B2B Satış' : '✓ B2B Sales',
              ].map(badge => (
                <span key={badge} className="text-xs font-medium text-green-700 bg-green-50 border border-green-100 px-3 py-1 rounded-full">
                  {badge}
                </span>
              ))}
            </div>

            <div className="mt-auto space-y-3 pt-4 border-t border-gray-100">
              <button
                onClick={handleAddToCart}
                className={`flex items-center justify-center gap-3 font-bold py-4 px-6 rounded-2xl transition-all w-full ${
                  addedToCart
                    ? 'bg-green-500 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/25'
                }`}>
                <ShoppingCart size={20} />
                {addedToCart
                  ? (lang === 'tr' ? '✓ Sepete Eklendi' : '✓ Added to Cart')
                  : (lang === 'tr' ? 'Sepete Ekle' : 'Add to Cart')}
              </button>
              {whatsappUrl && (
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-2xl transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-green-500/25 w-full">
                  <MessageCircle size={20} />
                  {lang === 'tr' ? 'WhatsApp ile Fiyat Al' : 'Get Price via WhatsApp'}
                </a>
              )}
              <Link to="/iletisim"
                className="flex items-center justify-center gap-2 border-2 border-gray-200 hover:border-blue-400 text-gray-700 hover:text-blue-600 font-semibold py-3.5 px-6 rounded-2xl transition-all w-full">
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

        {/* Detaylı açıklama */}
        {details && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 pb-4 border-b border-gray-100">
              {lang === 'tr' ? 'Ürün Detayları' : 'Product Details'}
            </h2>
            <div className="text-gray-600 leading-relaxed rich-content" dangerouslySetInnerHTML={{ __html: details }} />
          </div>
        )}

        {/* İlgili ürünler placeholder — kategori bazlı */}
        <RelatedProducts currentId={product.id} categoryId={product.category_id} lang={lang} />
      </div>

      {/* Lightbox */}
      {lightbox && images.length > 0 && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setLightbox(false)}>
          <button className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors">
            <X size={28} />
          </button>
          {images.length > 1 && (
            <>
              <button onClick={e => { e.stopPropagation(); setActiveImg(i => (i - 1 + images.length) % images.length) }}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-3 rounded-full hover:bg-white/10 transition-colors">
                <ChevronLeft size={32} />
              </button>
              <button onClick={e => { e.stopPropagation(); setActiveImg(i => (i + 1) % images.length) }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-3 rounded-full hover:bg-white/10 transition-colors">
                <ChevronRight size={32} />
              </button>
            </>
          )}
          <img src={images[activeImg]} alt={name} onClick={e => e.stopPropagation()}
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl" />
          {images.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
              {images.map((_, i) => (
                <button key={i} onClick={e => { e.stopPropagation(); setActiveImg(i) }}
                  className={`h-2 rounded-full transition-all ${i === activeImg ? 'bg-white w-6' : 'bg-white/40 w-2'}`} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// İlgili ürünler bileşeni
function RelatedProducts({ currentId, categoryId, lang }) {
  const [related, setRelated] = useState([])
  const navigate = useNavigate()
  const { t } = useTranslation()

  useEffect(() => {
    if (!categoryId) return
    api.get(`/products?active_only=true&category_id=${categoryId}`)
      .then(r => setRelated(r.data.filter(p => p.id !== currentId).slice(0, 4)))
      .catch(() => {})
  }, [currentId, categoryId])

  if (related.length === 0) return null

  return (
    <div className="mt-10">
      <h2 className="text-xl font-bold text-gray-900 mb-6">
        {lang === 'tr' ? 'Benzer Ürünler' : 'Related Products'}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {related.map(p => {
          const name = lang === 'tr' ? p.name_tr : p.name_en
          return (
            <div key={p.id} onClick={() => navigate(`/urun/${p.id}`)}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer overflow-hidden group">
              <div className="aspect-square bg-gray-50 overflow-hidden">
                {p.image
                  ? <img src={p.image} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  : <div className="w-full h-full flex items-center justify-center"><Package size={32} className="text-gray-300" /></div>}
              </div>
              <div className="p-3">
                <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">{name}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
