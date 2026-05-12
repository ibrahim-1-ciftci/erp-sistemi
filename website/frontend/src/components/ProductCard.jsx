import React, { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Package, ShoppingCart, ArrowRight, Check } from 'lucide-react'
import { cartStore } from '../store/cartStore'

export default function ProductCard({ product }) {
  const { i18n, t } = useTranslation()
  const navigate = useNavigate()
  const lang = i18n.language
  const [imgLoaded, setImgLoaded] = useState(false)
  const [added, setAdded] = useState(false)
  const imgRef = useRef(null)

  useEffect(() => {
    if (imgRef.current?.complete) setImgLoaded(true)
  }, [])

  const handleAddToCart = (e) => {
    e.stopPropagation()
    cartStore.addItem(product)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  const name = lang === 'tr' ? product.name_tr : product.name_en
  const rawDesc = lang === 'tr' ? product.description_tr : product.description_en
  // HTML tag'lerini temizle, sadece düz metin göster
  const desc = rawDesc ? rawDesc.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : ''
  const catName = product.category ? (lang === 'tr' ? product.category.name_tr : product.category.name_en) : ''

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
              ref={imgRef}
              src={product.image}
              alt={name}
              loading="lazy"
              onLoad={() => setImgLoaded(true)}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
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
        {/* İndirim rozeti */}
        {product.price_discounted && product.price && product.price_discounted < product.price && (
          <div className="absolute top-3 right-3">
            <span className="text-xs font-bold text-white bg-red-500 px-2 py-1 rounded-lg">
              %{product.discount_percent || Math.round((1 - product.price_discounted / product.price) * 100)} İND.
            </span>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-4">
          <div className="flex gap-2 translate-y-3 group-hover:translate-y-0 transition-transform duration-300">
            <button
              onClick={handleAddToCart}
              className={`flex-1 flex items-center justify-center gap-1.5 text-white text-xs font-bold py-2 px-3 rounded-xl transition-colors ${added ? 'bg-green-500' : 'bg-blue-600 hover:bg-blue-700'}`}>
              {added ? <Check size={13} /> : <ShoppingCart size={13} />}
              {added ? (lang === 'tr' ? 'Eklendi' : 'Added') : (lang === 'tr' ? 'Sepete Ekle' : 'Add to Cart')}
            </button>
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
        {product.show_price && product.price > 0 && (
          <div className="flex items-center gap-2 mt-2">
            {product.price_discounted && product.price_discounted < product.price ? (
              <>
                <span className="text-sm font-bold text-blue-600">{product.price_discounted.toLocaleString('tr-TR')} ₺</span>
                <span className="text-xs text-gray-400 line-through">{product.price.toLocaleString('tr-TR')} ₺</span>
              </>
            ) : (
              <span className="text-sm font-bold text-blue-600">{product.price.toLocaleString('tr-TR')} ₺</span>
            )}
            <span className="text-xs text-gray-400">/ {product.price_unit || 'adet'}</span>
          </div>
        )}
      </div>
    </div>
  )
}
