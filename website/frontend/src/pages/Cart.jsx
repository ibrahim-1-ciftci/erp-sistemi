import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Trash2, Plus, Minus, ShoppingCart, ArrowRight } from 'lucide-react'
import { cartStore } from '../store/cartStore'
import useSEO from '../hooks/useSEO'

export default function Cart() {
  const { i18n } = useTranslation()
  const lang = i18n.language
  const navigate = useNavigate()
  const [items, setItems] = useState(cartStore.getItems())

  useSEO({ title: lang === 'tr' ? 'Sepetim' : 'My Cart' })

  useEffect(() => {
    const handler = () => setItems(cartStore.getItems())
    window.addEventListener('cart-updated', handler)
    return () => window.removeEventListener('cart-updated', handler)
  }, [])

  const updateQty = (id, variantLabel, qty) => {
    const items = cartStore.getItems()
    const item = items.find(i => i.id === id && i.variantLabel === variantLabel)
    if (!item) return
    if (qty <= 0) {
      cartStore.removeItemByVariant(id, variantLabel)
    } else {
      item.qty = qty
      localStorage.setItem('laves_cart', JSON.stringify(items))
      window.dispatchEvent(new Event('cart-updated'))
    }
    setItems(cartStore.getItems())
  }
  const remove = (id, variantLabel) => {
    cartStore.removeItemByVariant(id, variantLabel)
    setItems(cartStore.getItems())
  }

  if (items.length === 0) {
    return (
      <div className="pt-16 min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingCart size={32} className="text-gray-300" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {lang === 'tr' ? 'Sepetiniz boş' : 'Your cart is empty'}
          </h2>
          <p className="text-gray-400 mb-6 text-sm">
            {lang === 'tr' ? 'Ürünleri inceleyerek sepetinize ekleyebilirsiniz.' : 'Browse products and add them to your cart.'}
          </p>
          <Link to="/urunler"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-2xl transition-colors">
            {lang === 'tr' ? 'Ürünlere Git' : 'Browse Products'} <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="pt-16 min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">
          {lang === 'tr' ? 'Sepetim' : 'My Cart'}
          <span className="ml-2 text-sm font-normal text-gray-400">({items.length} {lang === 'tr' ? 'ürün' : 'items'})</span>
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Ürünler */}
          <div className="lg:col-span-2 space-y-3">
            {items.map(item => {
              const name = lang === 'tr' ? item.name_tr : item.name_en
              return (
                <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                    {item.image
                      ? <img src={item.image} alt={name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full bg-gray-200" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link to={`/urun/${item.id}`} className="font-semibold text-gray-900 hover:text-blue-600 transition-colors line-clamp-1">
                      {name}
                    </Link>
                    {item.variantLabel && (
                      <span className="inline-block text-xs bg-blue-50 text-blue-600 font-medium px-2 py-0.5 rounded-full mt-0.5">
                        {item.variantLabel}
                      </span>
                    )}
                    {item.price > 0 && (
                      <p className="text-sm text-blue-600 font-bold mt-0.5">
                        {(item.price * item.qty).toLocaleString('tr-TR')} ₺
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => updateQty(item.id, item.variantLabel, item.qty - 1)}
                      className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
                      <Minus size={12} />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold">{item.qty}</span>
                    <button onClick={() => updateQty(item.id, item.variantLabel, item.qty + 1)}
                      className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
                      <Plus size={12} />
                    </button>
                  </div>
                  <button onClick={() => remove(item.id, item.variantLabel)}
                    className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors flex-shrink-0">
                    <Trash2 size={16} />
                  </button>
                </div>
              )
            })}
          </div>

          {/* Özet */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-bold text-gray-900 mb-4">{lang === 'tr' ? 'Sipariş Özeti' : 'Order Summary'}</h2>
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between text-gray-600">
                  <span>{lang === 'tr' ? 'Ürünler' : 'Products'}</span>
                  <span>{items.reduce((s, i) => s + i.qty, 0)} {lang === 'tr' ? 'adet' : 'pcs'}</span>
                </div>
                {cartStore.getTotal() > 0 && (
                  <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-100">
                    <span>{lang === 'tr' ? 'Toplam' : 'Total'}</span>
                    <span>{cartStore.getTotal().toLocaleString('tr-TR')} ₺</span>
                  </div>
                )}
              </div>
              <button
                onClick={() => navigate('/siparis')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl transition-all hover:shadow-lg hover:shadow-blue-500/25 flex items-center justify-center gap-2">
                {lang === 'tr' ? 'Siparişi Tamamla' : 'Complete Order'} <ArrowRight size={16} />
              </button>
            </div>

            <div className="bg-blue-50 rounded-2xl p-4 text-xs text-blue-700 space-y-1">
              <p>✓ {lang === 'tr' ? 'Güvenli ödeme' : 'Secure payment'}</p>
              <p>✓ {lang === 'tr' ? '14 gün iade garantisi' : '14-day return guarantee'}</p>
              <p>✓ {lang === 'tr' ? '3-7 iş günü teslimat' : '3-7 business days delivery'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
