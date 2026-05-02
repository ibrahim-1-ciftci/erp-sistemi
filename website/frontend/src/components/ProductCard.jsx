import React from 'react'
import { useTranslation } from 'react-i18next'
import { Package } from 'lucide-react'

export default function ProductCard({ product }) {
  const { i18n, t } = useTranslation()
  const lang = i18n.language
  const name = lang === 'tr' ? product.name_tr : product.name_en
  const desc = lang === 'tr' ? product.description_tr : product.description_en
  const catName = product.category ? (lang === 'tr' ? product.category.name_tr : product.category.name_en) : ''

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden group">
      <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden relative">
        {product.image ? (
          <img src={product.image} alt={name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
        ) : (
          <div className="flex flex-col items-center gap-3 text-gray-300">
            <div className="w-16 h-16 bg-gray-200 rounded-2xl flex items-center justify-center">
              <Package size={28} className="text-gray-400" />
            </div>
            <span className="text-xs text-gray-400">{t('products.noImage')}</span>
          </div>
        )}
        {catName && (
          <div className="absolute top-3 left-3">
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full">
              {catName}
            </span>
          </div>
        )}
      </div>
      <div className="p-5">
        <h3 className="font-bold text-gray-900 text-base mb-1 group-hover:text-blue-600 transition-colors">{name}</h3>
        {desc && <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">{desc}</p>}
      </div>
    </div>
  )
}
