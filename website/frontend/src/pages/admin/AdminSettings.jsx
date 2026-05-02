import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import api from '../../api/axios'

const FIELDS = [
  { key: 'company_name', label: 'Şirket Adı (TR)' },
  { key: 'company_name_en', label: 'Şirket Adı (EN)' },
  { key: 'phone', label: 'Telefon' },
  { key: 'email', label: 'E-posta' },
  { key: 'address', label: 'Adres' },
  { key: 'whatsapp', label: 'WhatsApp Numarası (+90...)' },
  { key: 'whatsapp_message_tr', label: 'WhatsApp Karşılama Mesajı (TR)' },
  { key: 'whatsapp_message_en', label: 'WhatsApp Karşılama Mesajı (EN)' },
  { key: 'about_tr', label: 'Hakkımızda (TR)', multiline: true },
  { key: 'about_en', label: 'Hakkımızda (EN)', multiline: true },
]

export default function AdminSettings() {
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get('/settings').then(r => setSettings(r.data)).catch(() => {})
  }, [])

  const handleSave = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      // null/undefined değerleri boş string'e çevir
      const clean = Object.fromEntries(
        Object.entries(settings).map(([k, v]) => [k, v ?? ''])
      )
      await api.put('/settings', clean, { headers: { 'Content-Type': 'application/json' } })
      toast.success('Ayarlar kaydedildi')
    } catch (err) {
      toast.error('Hata oluştu: ' + (err.response?.status || err.message))
    }
    finally { setLoading(false) }
  }

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Site Ayarları</h1>
      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        {FIELDS.map(f => (
          <div key={f.key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
            {f.multiline ? (
              <textarea rows={3} value={settings[f.key] || ''} onChange={e => setSettings({...settings, [f.key]: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            ) : (
              <input value={settings[f.key] || ''} onChange={e => setSettings({...settings, [f.key]: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            )}
          </div>
        ))}
        <button type="submit" disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60">
          {loading ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
      </form>
    </div>
  )
}
