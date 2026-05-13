import React, { useEffect, useState } from 'react'
import { Building2, Info, Home, FileText, Save, CreditCard, MonitorSmartphone } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../api/axios'

const SECTIONS = [
  {
    id: 'company',
    label: 'Şirket Bilgileri',
    icon: Building2,
    fields: [
      { key: 'company_name', label: 'Şirket Adı (TR)' },
      { key: 'company_name_en', label: 'Şirket Adı (EN)' },
      { key: 'phone', label: 'Telefon' },
      { key: 'email', label: 'E-posta' },
      { key: 'address', label: 'Adres', multiline: true, rows: 2 },
      { key: 'whatsapp', label: 'WhatsApp Numarası (+90...)' },
      { key: 'whatsapp_message_tr', label: 'WhatsApp Karşılama Mesajı (TR)' },
      { key: 'whatsapp_message_en', label: 'WhatsApp Karşılama Mesajı (EN)' },
    ]
  },
  {
    id: 'homepage',
    label: 'Ana Sayfa',
    icon: Home,
    fields: [
      { key: 'hero_title_tr', label: 'Hero Başlık (TR)', placeholder: 'Profesyonel Oto Bakım Ürünleri' },
      { key: 'hero_title_en', label: 'Hero Başlık (EN)', placeholder: 'Professional Auto Care Products' },
      { key: 'hero_subtitle_tr', label: 'Hero Alt Başlık (TR)', multiline: true, rows: 2 },
      { key: 'hero_subtitle_en', label: 'Hero Alt Başlık (EN)', multiline: true, rows: 2 },
      { key: 'stats_1_val', label: 'İstatistik 1 - Değer', placeholder: '30+' },
      { key: 'stats_1_label_tr', label: 'İstatistik 1 - Etiket (TR)', placeholder: 'Ürün Çeşidi' },
      { key: 'stats_2_val', label: 'İstatistik 2 - Değer', placeholder: '100%' },
      { key: 'stats_2_label_tr', label: 'İstatistik 2 - Etiket (TR)', placeholder: 'Kalite Kontrol' },
      { key: 'stats_3_val', label: 'İstatistik 3 - Değer', placeholder: 'B2B' },
      { key: 'stats_3_label_tr', label: 'İstatistik 3 - Etiket (TR)', placeholder: 'Kurumsal Satış' },
    ]
  },
  {
    id: 'about',
    label: 'Hakkımızda',
    icon: Info,
    fields: [
      { key: 'about_title_tr', label: 'Sayfa Başlığı (TR)', placeholder: 'Hakkımızda' },
      { key: 'about_title_en', label: 'Sayfa Başlığı (EN)', placeholder: 'About Us' },
      { key: 'about_tr', label: 'Hakkımızda Metni (TR)', multiline: true, rows: 8 },
      { key: 'about_en', label: 'Hakkımızda Metni (EN)', multiline: true, rows: 8 },
      { key: 'about_stat1_val', label: 'İstatistik 1 - Değer', placeholder: '30+' },
      { key: 'about_stat1_label_tr', label: 'İstatistik 1 - Etiket (TR)', placeholder: 'Ürün Çeşidi' },
      { key: 'about_stat2_val', label: 'İstatistik 2 - Değer', placeholder: '100%' },
      { key: 'about_stat2_label_tr', label: 'İstatistik 2 - Etiket (TR)', placeholder: 'Kalite Kontrol' },
      { key: 'about_stat3_val', label: 'İstatistik 3 - Değer', placeholder: 'B2B' },
      { key: 'about_stat3_label_tr', label: 'İstatistik 3 - Etiket (TR)', placeholder: 'Kurumsal Satış' },
    ]
  },
  {
    id: 'payment',
    label: 'Ödeme Bilgileri',
    icon: CreditCard,
    fields: [
      { key: 'payment_name', label: 'Hesap Sahibi Adı Soyadı', placeholder: 'Laves Kimya Ltd. Şti.' },
      { key: 'payment_bank', label: 'Banka Adı', placeholder: 'Ziraat Bankası' },
      { key: 'payment_iban', label: 'IBAN', placeholder: 'TR00 0000 0000 0000 0000 0000 00' },
      { key: 'payment_branch', label: 'Şube Adı / Kodu', placeholder: 'Merkez Şubesi / 0001' },
      { key: 'payment_account_no', label: 'Hesap Numarası', placeholder: '1234567' },
      { key: 'payment_note_tr', label: 'Ödeme Notu (TR)', multiline: true, rows: 3 },
      { key: 'payment_note_en', label: 'Ödeme Notu (EN)', multiline: true, rows: 3 },
    ]
  },
  {
    id: 'legal',
    label: 'Yasal Sayfalar',
    icon: FileText,
    fields: [
      { key: 'privacy_tr', label: 'Gizlilik Politikası (TR)', multiline: true, rows: 10 },
      { key: 'privacy_en', label: 'Gizlilik Politikası (EN)', multiline: true, rows: 10 },
      { key: 'returns_tr', label: 'İade & İptal Koşulları (TR)', multiline: true, rows: 10 },
      { key: 'returns_en', label: 'İade & İptal Koşulları (EN)', multiline: true, rows: 10 },
      { key: 'shipping_tr', label: 'Teslimat Bilgileri (TR)', multiline: true, rows: 10 },
      { key: 'shipping_en', label: 'Teslimat Bilgileri (EN)', multiline: true, rows: 10 },
      { key: 'sales_contract_tr', label: 'Mesafeli Satış Sözleşmesi (TR)', multiline: true, rows: 10 },
      { key: 'sales_contract_en', label: 'Mesafeli Satış Sözleşmesi (EN)', multiline: true, rows: 10 },
    ]
  },
]

export default function AdminSettings() {
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(false)
  const [activeSection, setActiveSection] = useState('company')
  const [saved, setSaved] = useState(false)
  const [loginLogs, setLoginLogs] = useState([])
  const [logsLoading, setLogsLoading] = useState(false)

  useEffect(() => {
    api.get('/settings').then(r => setSettings(r.data)).catch(() => {})
    loadLoginLogs()
  }, [])

  const loadLoginLogs = () => {
    setLogsLoading(true)
    api.get('/settings/login-logs').then(r => setLoginLogs(r.data)).catch(() => {}).finally(() => setLogsLoading(false))
  }

  const set = (key, val) => setSettings(prev => ({ ...prev, [key]: val }))

  const handleSave = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      const clean = Object.fromEntries(
        Object.entries(settings || {}).map(([k, v]) => [k, v ?? ''])
      )
      await api.put('/settings', clean, { headers: { 'Content-Type': 'application/json' } })
      toast.success('Kaydedildi')
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      toast.error('Hata: ' + (err.response?.status || err.message))
    } finally {
      setLoading(false)
    }
  }

  const currentSection = SECTIONS.find(s => s.id === activeSection)

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Site İçeriği</h1>
          <p className="text-sm text-gray-400 mt-0.5">Tüm sayfa içeriklerini buradan düzenleyin</p>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sol: Bölüm seçici */}
        <div className="w-48 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-2 space-y-1">
            {SECTIONS.map(s => (
              <button key={s.id} onClick={() => setActiveSection(s.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                  activeSection === s.id ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
                }`}>
                <s.icon size={16} />
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sağ: Form */}
        <div className="flex-1 min-w-0">
          <form onSubmit={handleSave}>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
              <div className="flex items-center gap-2 pb-4 border-b border-gray-100">
                {currentSection && <currentSection.icon size={18} className="text-blue-600" />}
                <h2 className="font-bold text-gray-900">{currentSection?.label}</h2>
              </div>

              {currentSection?.fields.map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{f.label}</label>
                  {f.multiline ? (
                    <textarea rows={f.rows || 4} value={settings[f.key] || ''} onChange={e => set(f.key, e.target.value)}
                      placeholder={f.placeholder || ''}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y" />
                  ) : (
                    <input value={settings[f.key] || ''} onChange={e => set(f.key, e.target.value)}
                      placeholder={f.placeholder || ''}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  )}
                </div>
              ))}

              <div className="pt-2 border-t border-gray-100">
                <button type="submit" disabled={loading}
                  className={`flex items-center gap-2 font-semibold py-2.5 px-6 rounded-xl transition-all ${
                    saved ? 'bg-green-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60'
                  }`}>
                  <Save size={16} />
                  {loading ? 'Kaydediliyor...' : saved ? '✓ Kaydedildi' : 'Kaydet'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Giris Gecmisi */}
      <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MonitorSmartphone size={18} className="text-teal-600" />
            <h2 className="font-bold text-gray-900">Admin Giriş Geçmişi</h2>
          </div>
          <button onClick={loadLoginLogs} className="text-xs px-3 py-1.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
            Yenile
          </button>
        </div>
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>{['Kullanıcı','Durum','IP Adresi','Cihaz','Tarayıcı','Ekran','Saat Dilimi','Tarih'].map(h =>
                <th key={h} className="px-3 py-2 text-left font-medium text-xs text-gray-500">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {logsLoading && <tr><td colSpan={8} className="text-center py-6 text-sm text-gray-400">Yükleniyor...</td></tr>}
              {!logsLoading && loginLogs.length === 0 && <tr><td colSpan={8} className="text-center py-6 text-sm text-gray-400">Henüz giriş kaydı yok</td></tr>}
              {!logsLoading && loginLogs.map(log => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium text-gray-900">{log.username}</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${log.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {log.success ? '✓ Başarılı' : '✗ Başarısız'}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-gray-500">{log.ip_address}</td>
                  <td className="px-3 py-2 text-xs">{log.device}</td>
                  <td className="px-3 py-2 text-xs text-gray-500">{log.browser}</td>
                  <td className="px-3 py-2 text-xs text-gray-500">{log.details?.match(/Ekran:([^\s|]+)/)?.[1] || '—'}</td>
                  <td className="px-3 py-2 text-xs text-gray-500">{log.details?.match(/TZ:([^\s|]+)/)?.[1] || '—'}</td>
                  <td className="px-3 py-2 text-xs text-gray-500">{new Date(log.created_at).toLocaleString('tr-TR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-400 mt-2">Son 100 giriş denemesi gösteriliyor.</p>
      </div>
    </div>
  )
}
