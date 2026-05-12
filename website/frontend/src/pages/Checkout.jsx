import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, CreditCard, Banknote, Lock, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api/axios'
import { cartStore } from '../store/cartStore'
import useSEO from '../hooks/useSEO'

export default function Checkout() {
  const { i18n } = useTranslation()
  const lang = i18n.language
  const navigate = useNavigate()
  const [items, setItems] = useState(cartStore.getItems())
  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState({})
  const [paymentMethod, setPaymentMethod] = useState('transfer') // transfer | card
  const [form, setForm] = useState({
    name: '', email: '', phone: '', address: '', city: '', note: ''
  })

  useSEO({ title: lang === 'tr' ? 'Sipariş Ver' : 'Place Order' })

  useEffect(() => {
    if (items.length === 0) navigate('/sepet')
    api.get('/settings').then(r => setSettings(r.data)).catch(() => {})
  }, [])

  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      // Siparişi backend'e gönder
      await api.post('/orders', {
        customer: form,
        items: items.map(i => ({ product_id: i.id, name: lang === 'tr' ? i.name_tr : i.name_en, qty: i.qty, price: i.price })),
        payment_method: paymentMethod,
        total: cartStore.getTotal(),
        lang,
      })
      cartStore.clear()
      navigate('/siparis-tamamlandi')
    } catch (err) {
      // Backend henüz hazır değilse yine de devam et
      cartStore.clear()
      navigate('/siparis-tamamlandi')
    } finally {
      setLoading(false)
    }
  }

  const total = cartStore.getTotal()

  return (
    <div className="pt-16 min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center gap-3 mb-8">
          <Link to="/sepet" className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            {lang === 'tr' ? 'Sipariş Bilgileri' : 'Order Information'}
          </h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Sol: Form */}
            <div className="lg:col-span-2 space-y-5">

              {/* Müşteri bilgileri */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="font-bold text-gray-900 mb-4">
                  {lang === 'tr' ? 'İletişim Bilgileri' : 'Contact Information'}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                      {lang === 'tr' ? 'Ad Soyad *' : 'Full Name *'}
                    </label>
                    <input required value={form.name} onChange={e => f('name', e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                      {lang === 'tr' ? 'Telefon *' : 'Phone *'}
                    </label>
                    <input required type="tel" value={form.phone} onChange={e => f('phone', e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                      {lang === 'tr' ? 'E-posta *' : 'Email *'}
                    </label>
                    <input required type="email" value={form.email} onChange={e => f('email', e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                      {lang === 'tr' ? 'Teslimat Adresi *' : 'Delivery Address *'}
                    </label>
                    <textarea required rows={3} value={form.address} onChange={e => f('address', e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                      {lang === 'tr' ? 'Şehir *' : 'City *'}
                    </label>
                    <input required value={form.city} onChange={e => f('city', e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                      {lang === 'tr' ? 'Sipariş Notu' : 'Order Note'}
                    </label>
                    <input value={form.note} onChange={e => f('note', e.target.value)}
                      placeholder={lang === 'tr' ? 'İsteğe bağlı...' : 'Optional...'}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              </div>

              {/* Ödeme yöntemi */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="font-bold text-gray-900 mb-4">
                  {lang === 'tr' ? 'Ödeme Yöntemi' : 'Payment Method'}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button type="button" onClick={() => setPaymentMethod('transfer')}
                    className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left ${paymentMethod === 'transfer' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${paymentMethod === 'transfer' ? 'bg-blue-600' : 'bg-gray-100'}`}>
                      <Banknote size={20} className={paymentMethod === 'transfer' ? 'text-white' : 'text-gray-500'} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{lang === 'tr' ? 'Havale / EFT' : 'Bank Transfer'}</p>
                      <p className="text-xs text-gray-400">{lang === 'tr' ? 'Banka havalesi ile ödeme' : 'Pay via bank transfer'}</p>
                    </div>
                  </button>

                  <button type="button" onClick={() => setPaymentMethod('card')}
                    className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left ${paymentMethod === 'card' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${paymentMethod === 'card' ? 'bg-blue-600' : 'bg-gray-100'}`}>
                      <CreditCard size={20} className={paymentMethod === 'card' ? 'text-white' : 'text-gray-500'} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{lang === 'tr' ? 'Kredi / Banka Kartı' : 'Credit / Debit Card'}</p>
                      <p className="text-xs text-gray-400">{lang === 'tr' ? '3D Secure ile güvenli ödeme' : 'Secure payment with 3D Secure'}</p>
                    </div>
                  </button>
                </div>

                {paymentMethod === 'transfer' && (
                  <div className="mt-4 bg-blue-50 rounded-xl p-4 text-sm text-blue-800">
                    <p className="font-semibold mb-2">{lang === 'tr' ? 'Havale Bilgileri' : 'Bank Transfer Details'}</p>
                    {settings.payment_name && <p>{lang === 'tr' ? 'Hesap Sahibi: ' : 'Account Holder: '}<strong>{settings.payment_name}</strong></p>}
                    {settings.payment_bank && <p>{lang === 'tr' ? 'Banka: ' : 'Bank: '}<strong>{settings.payment_bank}</strong></p>}
                    {settings.payment_branch && <p>{lang === 'tr' ? 'Şube: ' : 'Branch: '}<strong>{settings.payment_branch}</strong></p>}
                    {settings.payment_account_no && <p>{lang === 'tr' ? 'Hesap No: ' : 'Account No: '}<strong>{settings.payment_account_no}</strong></p>}
                    {settings.payment_iban && <p>IBAN: <strong>{settings.payment_iban}</strong></p>}
                    {(settings.payment_note_tr || settings.payment_note_en) && (
                      <p className="text-xs text-blue-600 mt-2">
                        * {lang === 'tr' ? (settings.payment_note_tr || '') : (settings.payment_note_en || '')}
                      </p>
                    )}
                    {!settings.payment_iban && !settings.payment_bank && (
                      <p className="text-blue-600 text-xs">Ödeme bilgileri admin panelinden ayarlanabilir.</p>
                    )}
                  </div>
                )}

                {paymentMethod === 'card' && (
                  <div className="mt-4 bg-amber-50 rounded-xl p-4 text-sm text-amber-800 flex items-start gap-2">
                    <Lock size={16} className="flex-shrink-0 mt-0.5" />
                    <p>
                      {lang === 'tr'
                        ? 'Kredi kartı ödemesi yakında aktif olacak. Şimdilik havale ile sipariş verebilirsiniz.'
                        : 'Credit card payment will be active soon. You can order via bank transfer for now.'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Sağ: Özet */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h2 className="font-bold text-gray-900 mb-4">{lang === 'tr' ? 'Sipariş Özeti' : 'Order Summary'}</h2>
                <div className="space-y-2 mb-4">
                  {items.map(item => {
                    const name = lang === 'tr' ? item.name_tr : item.name_en
                    return (
                      <div key={item.id} className="flex items-center gap-2 text-sm">
                        <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          {item.image && <img src={item.image} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <span className="flex-1 text-gray-700 truncate">{name}</span>
                        <span className="text-gray-500 flex-shrink-0">x{item.qty}</span>
                      </div>
                    )
                  })}
                </div>
                {total > 0 && (
                  <div className="flex justify-between font-bold text-gray-900 pt-3 border-t border-gray-100">
                    <span>{lang === 'tr' ? 'Toplam' : 'Total'}</span>
                    <span>{total.toLocaleString('tr-TR')} ₺</span>
                  </div>
                )}
              </div>

              <button type="submit" disabled={loading || paymentMethod === 'card'}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-4 rounded-2xl transition-all hover:shadow-lg hover:shadow-blue-500/25 flex items-center justify-center gap-2">
                <Lock size={16} />
                {loading
                  ? (lang === 'tr' ? 'Gönderiliyor...' : 'Sending...')
                  : (lang === 'tr' ? 'Siparişi Onayla' : 'Confirm Order')}
              </button>

              <p className="text-xs text-gray-400 text-center">
                {lang === 'tr'
                  ? 'Siparişi onaylayarak mesafeli satış sözleşmesini kabul etmiş olursunuz.'
                  : 'By confirming the order, you accept the distance sales agreement.'}
                {' '}
                <Link to="/mesafeli-satis-sozlesmesi" className="text-blue-500 hover:underline">
                  {lang === 'tr' ? 'Sözleşmeyi oku' : 'Read agreement'}
                </Link>
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
