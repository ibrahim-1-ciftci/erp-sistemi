import { useEffect, useState } from 'react'
import api from '../api/axios'
import { downloadExcel } from '../api/axios'
import toast from 'react-hot-toast'
import Table from '../components/Table'
import Modal from '../components/Modal'
import Pagination from '../components/Pagination'
import { Plus, Search, Eye, Trash2, Edit2, User, Download, Tag, BookOpen } from 'lucide-react'

const emptyForm = { name: '', phone: '', email: '', address: '', notes: '', payment_term_days: '' }

const statusBadge = s => {
  const map = { pending: 'bg-yellow-100 text-yellow-700', in_production: 'bg-blue-100 text-blue-700', completed: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700' }
  const labels = { pending: 'Bekliyor', in_production: 'Üretimde', completed: 'Tamamlandı', cancelled: 'İptal' }
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[s]}`}>{labels[s]}</span>
}

export default function Customers() {
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const [priceModal, setPriceModal] = useState(false)
  const [priceCustomer, setPriceCustomer] = useState(null)
  const [bomModal, setBomModal] = useState(false)
  const [bomCustomer, setBomCustomer] = useState(null)
  const [customerBoms, setCustomerBoms] = useState([])
  const [allBoms, setAllBoms] = useState([]) // tüm ürün+bom listesi
  const [products, setProducts] = useState([])
  const [customerPrices, setCustomerPrices] = useState([]) // [{product_id, price}]
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState(null)
  const [viewCustomer, setViewCustomer] = useState(null)
  const limit = 15

  const load = () => {
    api.get('/customers', { params: { skip: (page - 1) * limit, limit, search } })
      .then(r => { setItems(r.data.items); setTotal(r.data.total) })
  }

  useEffect(() => { load() }, [page, search])
  useEffect(() => { api.get('/products', { params: { limit: 200 } }).then(r => setProducts(r.data.items)) }, [])
  useEffect(() => { api.get('/bom', { params: { limit: 500 } }).then(r => setAllBoms(r.data.items)) }, [])

  const openPrices = async (c) => {
    setPriceCustomer(c)
    const res = await api.get(`/customers/${c.id}/prices`)
    const priceMap = {}
    res.data.forEach(p => { priceMap[p.product_id] = p.price })
    setPriceModal(true)
    const allProducts = (await api.get('/products', { params: { limit: 200 } })).data.items
    setCustomerPrices(allProducts.map(p => ({
      product_id: p.id,
      product_name: p.name,
      standard_price: p.sale_price,
      price: priceMap[p.id] !== undefined ? priceMap[p.id] : ''
    })))
  }

  const openBoms = async (c) => {
    setBomCustomer(c)
    const res = await api.get(`/customers/${c.id}/boms`)
    // Mevcut özel reçeteleri map'e al
    const bomMap = {}
    res.data.forEach(b => { bomMap[b.product_id] = b.bom_id })
    // Reçetesi olan tüm ürünleri listele
    const bomsRes = await api.get('/bom', { params: { limit: 500 } })
    const productMap = {}
    bomsRes.data.items.forEach(b => {
      if (!productMap[b.product_id]) productMap[b.product_id] = { product_name: b.product_name, versions: [] }
      productMap[b.product_id].versions.push({ bom_id: b.id, version: b.version, notes: b.notes })
    })
    setCustomerBoms(Object.entries(productMap).map(([pid, data]) => ({
      product_id: Number(pid),
      product_name: data.product_name,
      versions: data.versions,
      selected_bom_id: bomMap[Number(pid)] || ''
    })))
    setBomModal(true)
  }

  const saveBoms = async () => {
    const toSave = customerBoms.filter(b => b.selected_bom_id)
    try {
      await api.put(`/customers/${bomCustomer.id}/boms`,
        toSave.map(b => ({ product_id: b.product_id, bom_id: Number(b.selected_bom_id) })))
      toast.success('Özel reçeteler kaydedildi')
      setBomModal(false)
    } catch (e) { toast.error(e.response?.data?.detail || 'Hata') }
  }

  const savePrices = async () => {
    const toSave = customerPrices.filter(p => p.price !== '' && p.price !== null)
    try {
      await api.put(`/customers/${priceCustomer.id}/prices`,
        toSave.map(p => ({ product_id: p.product_id, price: Number(p.price) })))
      toast.success('Özel fiyatlar kaydedildi')
      setPriceModal(false)
    } catch (e) { toast.error(e.response?.data?.detail || 'Hata') }
  }

  const openCreate = () => { setForm(emptyForm); setEditId(null); setModal('form') }
  const openEdit = (c) => { setForm({ name: c.name, phone: c.phone || '', email: c.email || '', address: c.address || '', notes: c.notes || '', payment_term_days: c.payment_term_days || '' }); setEditId(c.id); setModal('form') }

  const openView = async (c) => {
    const res = await api.get(`/customers/${c.id}`)
    setViewCustomer(res.data)
    setModal('view')
  }

  const handleSave = async () => {
    if (!form.name) return toast.error('Müşteri adı zorunlu')
    try {
      const payload = {
        ...form,
        payment_term_days: form.payment_term_days !== '' && form.payment_term_days !== null
          ? Number(form.payment_term_days)
          : null
      }
      if (editId) {
        await api.put(`/customers/${editId}`, payload)
        toast.success('Güncellendi')
      } else {
        await api.post('/customers', payload)
        toast.success('Müşteri oluşturuldu')
      }
      setModal(null); load()
    } catch (e) { toast.error(e.response?.data?.detail || 'Hata') }
  }

  const handleDelete = async (id) => {
    if (!confirm('Müşteriyi silmek istediğinize emin misiniz?')) return
    try { await api.delete(`/customers/${id}`); toast.success('Silindi'); load() }
    catch { toast.error('Hata') }
  }

  const columns = [
    { key: 'name', label: 'Müşteri Adı', render: r => (
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
          <User size={13} className="text-blue-600" />
        </div>
        <span className="font-medium">{r.name}</span>
      </div>
    )},
    { key: 'phone', label: 'Telefon', render: r => r.phone || '-' },
    { key: 'email', label: 'E-posta', render: r => r.email || '-' },
    { key: 'order_count', label: 'Sipariş', render: r => (
      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">{r.order_count} sipariş</span>
    )},
    { key: 'payment_term_days', label: 'Vade', render: r => r.payment_term_days
      ? <span className="px-2 py-0.5 bg-orange-50 text-orange-700 rounded-full text-xs font-medium">{r.payment_term_days} gün</span>
      : <span className="text-gray-400 text-xs">—</span>
    },
    { key: 'created_at', label: 'Kayıt Tarihi', render: r => new Date(r.created_at).toLocaleDateString('tr-TR') },
    { key: 'actions', label: '', render: r => (
      <div className="flex gap-1">
        <button onClick={() => openView(r)} className="text-blue-600 hover:text-blue-800 p-1"><Eye size={14} /></button>
        <button onClick={() => openEdit(r)} className="text-gray-500 hover:text-gray-700 p-1"><Edit2 size={14} /></button>
        <button onClick={() => openPrices(r)} className="text-orange-500 hover:text-orange-700 p-1" title="Özel Fiyatlar"><Tag size={14} /></button>
        <button onClick={() => openBoms(r)} className="text-green-600 hover:text-green-800 p-1" title="Özel Reçeteler"><BookOpen size={14} /></button>
        <button onClick={() => handleDelete(r.id)} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={14} /></button>
      </div>
    )}
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Müşteriler</h1>
        <div className="flex gap-2">
          <button onClick={() => downloadExcel('customers', 'musteriler.xlsx').catch(() => toast.error('Hata'))}
            className="flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 text-sm">
            <Download size={15} /> Müşteri Listesi
          </button>
          <button onClick={async () => {
            try {
              const token = localStorage.getItem('token')
              const res = await fetch('/api/customers/export/prices', { headers: { Authorization: `Bearer ${token}` } })
              if (!res.ok) throw new Error()
              const blob = await res.blob()
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a'); a.href = url; a.download = 'ozel_fiyatlar.xlsx'; a.click()
              URL.revokeObjectURL(url)
            } catch { toast.error('Hata') }
          }} className="flex items-center gap-2 bg-orange-600 text-white px-3 py-2 rounded-lg hover:bg-orange-700 text-sm">
            <Tag size={15} /> Özel Fiyatlar
          </button>
          <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
            <Plus size={16} /> Yeni Müşteri
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
        <div className="relative w-64">
          <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
          <input placeholder="Müşteri ara..." className="pl-9 border rounded-lg px-3 py-2 text-sm w-full"
            value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <Table columns={columns} data={items} />
        <Pagination page={page} total={total} limit={limit} onChange={setPage} />
      </div>

      {modal === 'form' && (
        <Modal title={editId ? 'Müşteri Düzenle' : 'Yeni Müşteri'} onClose={() => setModal(null)}>
          <div className="space-y-3">
            {[['name','Müşteri Adı *'],['phone','Telefon'],['email','E-posta'],['address','Adres'],['notes','Notlar']].map(([k,l]) => (
              <div key={k}>
                <label className="block text-sm font-medium mb-1">{l}</label>
                {k === 'address' || k === 'notes'
                  ? <textarea rows={2} className="w-full border rounded-lg px-3 py-2 text-sm" value={form[k]} onChange={e => setForm({...form,[k]:e.target.value})} />
                  : <input className="w-full border rounded-lg px-3 py-2 text-sm" value={form[k]} onChange={e => setForm({...form,[k]:e.target.value})} />
                }
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium mb-1">Vade Günü</label>
              <div className="flex items-center gap-2">
                <input type="number" min="0" placeholder="Örn: 30" className="w-32 border rounded-lg px-3 py-2 text-sm"
                  value={form.payment_term_days} onChange={e => setForm({...form, payment_term_days: e.target.value})} />
                <span className="text-sm text-gray-500">gün (boş bırakılırsa vade uygulanmaz)</span>
              </div>
              <div className="flex gap-2 mt-1">
                {[15,30,45,60,90].map(d => (
                  <button key={d} type="button" onClick={() => setForm({...form, payment_term_days: d})}
                    className={`text-xs px-2 py-0.5 rounded border ${form.payment_term_days == d ? 'bg-blue-600 text-white border-blue-600' : 'text-blue-600 border-blue-200 hover:bg-blue-50'}`}>
                    {d} gün
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleSave} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 text-sm">Kaydet</button>
            <button onClick={() => setModal(null)} className="flex-1 border py-2 rounded-lg text-sm">İptal</button>
          </div>
        </Modal>
      )}

      {modal === 'view' && viewCustomer && (
        <Modal title={viewCustomer.name} onClose={() => setModal(null)}>
          <div className="space-y-2 text-sm mb-4">
            {viewCustomer.phone && <p><span className="text-gray-500">Tel:</span> {viewCustomer.phone}</p>}
            {viewCustomer.email && <p><span className="text-gray-500">E-posta:</span> {viewCustomer.email}</p>}
            {viewCustomer.address && <p><span className="text-gray-500">Adres:</span> {viewCustomer.address}</p>}
            {viewCustomer.notes && <p><span className="text-gray-500">Notlar:</span> {viewCustomer.notes}</p>}
          </div>
          <h3 className="font-semibold text-sm mb-2">Sipariş Geçmişi ({viewCustomer.order_count})</h3>
          {viewCustomer.orders?.length > 0 ? (
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-gray-50">
                <th className="text-left px-3 py-2">#</th>
                <th className="text-left px-3 py-2">Durum</th>
                <th className="text-left px-3 py-2">Tarih</th>
              </tr></thead>
              <tbody className="divide-y">
                {viewCustomer.orders.map(o => (
                  <tr key={o.id}>
                    <td className="px-3 py-2">#{o.id}</td>
                    <td className="px-3 py-2">{statusBadge(o.status)}</td>
                    <td className="px-3 py-2">{new Date(o.created_at).toLocaleDateString('tr-TR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p className="text-gray-400 text-sm">Henüz sipariş yok</p>}
        </Modal>
      )}

      {/* Özel Fiyat Modalı */}
      {priceModal && priceCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h2 className="text-lg font-semibold">Özel Fiyatlar — {priceCustomer.name}</h2>
                <p className="text-xs text-gray-500 mt-0.5">Boş bırakılan ürünlerde standart fiyat uygulanır</p>
              </div>
              <button onClick={() => setPriceModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="overflow-y-auto flex-1 p-4">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Ürün</th>
                    <th className="text-right px-3 py-2 font-medium text-gray-600">Standart Fiyat</th>
                    <th className="text-right px-3 py-2 font-medium text-gray-600">Özel Fiyat (₺)</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {customerPrices.map((p, i) => (
                    <tr key={p.product_id} className={p.price !== '' ? 'bg-orange-50' : ''}>
                      <td className="px-3 py-2">{p.product_name}</td>
                      <td className="px-3 py-2 text-right text-gray-500">₺{p.standard_price}</td>
                      <td className="px-3 py-2 text-right">
                        <input type="number" min="0" step="0.01"
                          placeholder={`₺${p.standard_price}`}
                          className="w-28 border rounded px-2 py-1 text-sm text-right"
                          value={p.price}
                          onChange={e => {
                            const updated = [...customerPrices]
                            updated[i] = { ...updated[i], price: e.target.value }
                            setCustomerPrices(updated)
                          }} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-2 p-4 border-t">
              <button onClick={savePrices} className="flex-1 bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 text-sm font-medium">
                Fiyatları Kaydet
              </button>
              <button onClick={() => setPriceModal(false)} className="flex-1 border py-2 rounded-lg text-sm">İptal</button>
            </div>
          </div>
        </div>
      )}

      {/* Özel Reçete Modalı */}
      {bomModal && bomCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h2 className="text-lg font-semibold">Özel Reçeteler — {bomCustomer.name}</h2>
                <p className="text-xs text-gray-500 mt-0.5">Boş bırakılan ürünlerde standart (en son) reçete kullanılır</p>
              </div>
              <button onClick={() => setBomModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="overflow-y-auto flex-1 p-4">
              {customerBoms.length === 0 && (
                <p className="text-gray-400 text-sm text-center py-8">Reçetesi olan ürün bulunamadı</p>
              )}
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Ürün</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Kullanılacak Reçete</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {customerBoms.map((b, i) => (
                    <tr key={b.product_id} className={b.selected_bom_id ? 'bg-green-50' : ''}>
                      <td className="px-3 py-2 font-medium">{b.product_name}</td>
                      <td className="px-3 py-2">
                        <select
                          className="w-full border rounded px-2 py-1.5 text-sm"
                          value={b.selected_bom_id}
                          onChange={e => {
                            const updated = [...customerBoms]
                            updated[i] = { ...updated[i], selected_bom_id: e.target.value }
                            setCustomerBoms(updated)
                          }}>
                          <option value="">— Standart (en son versiyon) —</option>
                          {b.versions.map(v => (
                            <option key={v.bom_id} value={v.bom_id}>
                              Versiyon {v.version}{v.notes ? ` — ${v.notes}` : ''}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-2 p-4 border-t">
              <button onClick={saveBoms} className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 text-sm font-medium">
                Reçeteleri Kaydet
              </button>
              <button onClick={() => setBomModal(false)} className="flex-1 border py-2 rounded-lg text-sm">İptal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
