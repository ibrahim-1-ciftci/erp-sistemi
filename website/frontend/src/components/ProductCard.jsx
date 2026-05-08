import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Package, MessageCircle, ArrowRight } from 'lucide-react'

export default function ProductCard({ product }) {
  const { i18n, t } = useTranslation()
  const navigate = useNavigate()
  const lang = i18n.language
  const [imgLoaded, setImgLoaded] = useState(false)

  const name = lang === 'tr' ? product.name_tr : product.name_en
  const desc = lang === 'tr' ? product.description_tr : product.description_en
  const catName = product.category ? (lang === 'tr' ? product.category.name_tr : product.category.name_en) : ''

  const waMsg = lang === 'tr'
    ? `Merhaba, "${name}" ürünü hakkında bilgi ve fiyat almak istiyorum.`
    : `Hello, I would like to get information and pricing for "${name}".`

  return (
    <div
      className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 overflow-hidden group cursor-pointer relative"
      onClick={() => navigate(`/urun/${product.id}`)}>

      {/* Görsel */}
      <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden relative">
        {product.image ? (
          <>
            {!imgLoaded && <div className="absolute inset-0 skeleton" />}
            <img
              src={product.image}
              alt={name}
              loading="lazy"
              onLoad={() => setImgLoaded(true)}
              className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
            />
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 text-gray-300">
            <div className="w-16 h-16 bg-gray-200 rounded-2xl flex items-center justify-center">
              <Package size={28} className="text-gray-400" />
            </div>
            <span className="text-xs text-gray-400">{t('products.noImage')}</span>
          </div>
        )}

        {/* Kategori rozeti */}
        {catName && (
          <div className="absolute top-3 left-3">
            <span className="text-xs font-semibold text-blue-700 bg-blue-50/90 backdrop-blur-sm border border-blue-100 px-2.5 py-1 rounded-full">
              {catName}
            </span>
          </div>
        )}

        {/* Hover overlay — Teklif Al */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-4">
          <div className="flex gap-2 translate-y-3 group-hover:translate-y-0 transition-transform duration-300">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(waMsg)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="flex-1 flex items-center justify-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-bold py-2 px-3 rounded-xl transition-colors">
              <MessageCircle size={13} />
              {lang === 'tr' ? 'Teklif Al' : 'Get Quote'}
            </a>
            <button
              onClick={e => { e.stopPropagation(); navigate(`/urun/${product.id}`) }}
              className="flex items-center justify-center gap-1 bg-white/90 hover:bg-white text-gray-900 text-xs font-bold py-2 px-3 rounded-xl transition-colors">
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* İçerik */}
      <div className="p-5">
        <h3 className="font-bold text-gray-900 text-base mb-1 group-hover:text-blue-600 transition-colors leading-snug line-clamp-2">{name}</h3>
        {desc && <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">{desc}</p>}
      </div>
    </div>
  )
}
