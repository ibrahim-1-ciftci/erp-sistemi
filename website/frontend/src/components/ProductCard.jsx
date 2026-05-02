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
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
      <div className="aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
        {product.image ? (
          <img src={product.image} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-300">
            <Package size={48} />
            <span className="text-xs">{t('products.noImage')}</span>
          </div>
        )}
      </div>
      <div className="p-4">
        {catName && (
          <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{catName}</span>
        )}
        <h3 className="font-semibold text-gray-900 mt-2 mb-1">{name}</h3>
        {desc && <p className="text-sm text-gray-500 line-clamp-2">{desc}</p>}
      </div>
    </div>
  )
}
