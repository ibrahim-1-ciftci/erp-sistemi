import React, { useEffect, useState } from 'react'
import { Eye, Trash2, X, Package, Phone, Mail, MapPin, CreditCard, Banknote, ShoppingBag, Truck } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../api/axios'

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Bekliyor', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  { value: 'confirmed', label: 'Onaylandı', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'shipped', label: 'Kargoda', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { value: 'delivered', label: 'Teslim Edildi', color: 'bg-green-50 text-green-700 border-green-200' },
  { value: 'cancelled', label: 'İptal', color: 'bg-red-50 text-red-700 border-red-200' },
]
function statusInfo(val) {
  return STATUS_OPTIONS.find(s => s.value === val) || STATUS_OPTIONS[0]
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [filterStatus, setFilterStatus] = useState('')

  const load = () => {
    setLoading(true)
    api.get('/orders').then(r => { setOrders(r.data); setLoading(false) }).catch(() => setLoading(false))
  }
  useEffect(load, [])

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/orders/${id}/status`, { status })
      toast.success('Durum güncellendi')
      load()
      if (selected?.id === id) setSelected(prev => ({ ...prev, status }))
    } catch { toast.error('Hata oluştu') }
  }

  const handleDelete = async id => {
    if (!confirm('Siparişi silmek istediğinize emin misiniz?')) return
    try {
      await api.delete(`/orders/${id}`)
      toast.success('Silindi')
      setSelected(null)
      load()
    } catch { toast.error('Hata oluştu') }
  }

  const filtered = orders.filter(o => !filterStatus || o.status === filterStatus)
  const counts = STATUS_OPTIONS.reduce((acc, s) => {
    acc[s.value] = orders.filter(o => o.status === s.value).length
    return acc
  }, {})

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Siparişler</h1>
          <p className="text-sm text-gray-400 mt-0.5">{orders.length} sipariş · {counts.pending || 0} bekliyor</p>
        </div>
      </div>

      {/* Durum filtreleri */}
      <div className="flex flex-wrap gap-2 mb-5">
        <button onClick={() => setFilterStatus('')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${!filterStatus ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
          Tümü ({orders.length})
        </button>
        {STATUS_OPTIONS.map(s => (
          <button key={s.value} onClick={() => setFilterStatus(s.value)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${filterStatus === s.value ? s.color + ' border-current' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
            {s.label} ({counts[s.value] || 0})
          </button>
        ))}
      </div>

      {/* Tablo */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase">#</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase">Müşteri</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase hidden md:table-cell">Ürünler</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase hidden lg:table-cell">Ödeme</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase">Durum</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase hidden md:table-cell">Tarih</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500 text-xs uppercase">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading && Array.from({ length: 4 }).map((_, i) => (
              <tr key={i}>
                {Array.from({ length: 7 }).map((_, j) => (
                  <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                ))}
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={7} className="text-center py-16 text-gray-400">
                <ShoppingBag size={32} className="mx-auto mb-2 text-gray-200" />
                Sipariş bulunamadı
              </td></tr>
            )}
            {!loading && filtered.map(o => {
              const st = statusInfo(o.status)
              return (
                <tr key={o.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelected(o)}>
                  <td className="px-4 py-3 font-mono text-gray-400 text-xs">#{o.id}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-900">{o.customer_name}</p>
                    <p className="text-xs text-gray-400">{o.customer_email}</p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-gray-500">
                    {o.items?.length} ürün
                    {o.total > 0 && <span className="ml-1 text-blue-600 font-semibold">· {o.total.toLocaleString('tr-TR')} ₺</span>}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      {o.payment_method === 'card' ? <CreditCard size={12} /> : <Banknote size={12} />}
                      {o.payment_method === 'card' ? 'Kart' : 'Havale'}
                    </span>
                  </td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <select
                      value={o.status}
                      onChange={e => updateStatus(o.id, e.target.value)}
                      className={`text-xs font-semibold px-2 py-1 rounded-lg border cursor-pointer focus:outline-none ${st.color}`}>
                      {STATUS_OPTIONS.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400 hidden md:table-cell">
                    {o.created_at ? new Date(o.created_at).toLocaleDateString('tr-TR') : '-'}
                  </td>
                  <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setSelected(o)}
                        className="p-1.5 hover:bg-blue-50 rounded-lg text-gray-400 hover:text-blue-600 transition-colors">
                        <Eye size={15} />
                      </button>
                      <button onClick={() => handleDelete(o.id)}
                        className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Detay modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h2 className="font-bold text-gray-900">Sipariş #{selected.id}</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {selected.created_at ? new Date(selected.created_at).toLocaleString('tr-TR') : ''}
                </p>
              </div>
              <button onClick={() => setSelected(null)}><X size={18} className="text-gray-400" /></button>
            </div>

            <div className="p-5 space-y-5">
              {/* Durum */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700">Durum:</span>
                <select
                  value={selected.status}
                  onChange={e => updateStatus(selected.id, e.target.value)}
                  className={`text-sm font-semibold px-3 py-1.5 rounded-xl border cursor-pointer focus:outline-none ${statusInfo(selected.status).color}`}>
                  {STATUS_OPTIONS.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              {/* Müşteri bilgileri */}
              <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
                <h3 className="font-semibold text-gray-900 text-sm mb-3">Müşteri Bilgileri</h3>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Package size={14} className="text-gray-400" />
                  <span className="font-medium">{selected.customer_name}</span>
                </div>
                {selected.customer_email && (
                  <a href={`mailto:${selected.customer_email}`} className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                    <Mail size={14} /> {selected.customer_email}
                  </a>
                )}
                {selected.customer_phone && (
                  <a href={`tel:${selected.customer_phone}`} className="flex items-center gap-2 text-sm text-green-600 hover:underline">
                    <Phone size={14} /> {selected.customer_phone}
                  </a>
                )}
                {selected.customer_address && (
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <MapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <span>{selected.customer_address}{selected.customer_city ? `, ${selected.customer_city}` : ''}</span>
                  </div>
                )}
                {selected.note && (
                  <div className="mt-2 pt-2 border-t border-gray-200 text-sm text-gray-500 italic">
                    Not: {selected.note}
                  </div>
                )}
              </div>

              {/* Ürünler */}
              <div>
                <h3 className="font-semibold text-gray-900 text-sm mb-3">Sipariş Kalemleri</h3>
                <div className="space-y-2">
                  {(selected.items || []).map((item, i) => (
                    <div key={i} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2.5">
                      <span className="text-sm text-gray-800">{item.name}</span>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-gray-400">x{item.qty}</span>
                        {item.price > 0 && (
                          <span className="font-semibold text-blue-600">{(item.price * item.qty).toLocaleString('tr-TR')} ₺</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {selected.total > 0 && (
                  <div className="flex justify-between font-bold text-gray-900 mt-3 pt-3 border-t border-gray-100">
                    <span>Toplam</span>
                    <span className="text-blue-600">{selected.total.toLocaleString('tr-TR')} ₺</span>
                  </div>
                )}
              </div>

              {/* Ödeme */}
              <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-xl px-4 py-3">
                {selected.payment_method === 'card' ? <CreditCard size={16} className="text-blue-500" /> : <Banknote size={16} className="text-green-500" />}
                <span>Ödeme: <strong>{selected.payment_method === 'card' ? 'Kredi Kartı' : 'Havale / EFT'}</strong></span>
              </div>

              {/* Aksiyonlar */}
              <div className="flex gap-3 pt-2">
                {selected.status !== 'shipped' && selected.status !== 'delivered' && selected.status !== 'cancelled' && (
                  <button onClick={() => updateStatus(selected.id, 'shipped')}
                    className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
                    <Truck size={15} /> Kargoya Ver (Mail Gönder)
                  </button>
                )}
                {selected.customer_email && (
                  <a href={`mailto:${selected.customer_email}?subject=Siparişiniz Hakkında - #${selected.id}`}
                    className="flex items-center justify-center gap-2 border border-blue-200 text-blue-600 hover:bg-blue-50 font-semibold py-2.5 px-4 rounded-xl text-sm transition-colors">
                    <Mail size={15} />
                  </a>
                )}
                <button onClick={() => handleDelete(selected.id)}
                  className="flex items-center justify-center gap-2 border border-red-200 text-red-500 hover:bg-red-50 font-semibold py-2.5 px-4 rounded-xl text-sm transition-colors">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
