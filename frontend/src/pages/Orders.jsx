import { useEffect, useState } from 'react'
import api from '../api/axios'
import { downloadExcel } from '../api/axios'
import toast from 'react-hot-toast'
import Table from '../components/Table'
import Modal from '../components/Modal'
import Pagination from '../components/Pagination'
import { Plus, Search, Eye, Trash2, Factory, FileText, UserCheck, Truck, Download } from 'lucide-react'

const emptyForm = { customer_id: '', customer_name: '', customer_phone: '', customer_email: '', notes: '', items: [] }

const statusBadge = s => {
  const map = { pending: 'bg-yellow-100 text-yellow-700', in_production: 'bg-blue-100 text-blue-700', completed: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700', shipped: 'bg-purple-100 text-purple-700' }
  const labels = { pending: 'Bekliyor', in_production: 'Üretimde', completed: 'Tamamlandı', cancelled: 'İptal', shipped: 'Sevkiyatta' }
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[s]}`}>{labels[s]}</span>
}

export default function Orders() {
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [products, setProducts] = useState([])
  const [customers, setCustomers] = useState([])
  const [modal, setModal] = useState(null)
  const [viewOrder, setViewOrder] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const limit = 15

  const load = () => {
    api.get('/orders', { params: { skip: (page - 1) * limit, limit, search, status: statusFilter || undefined } })
      .then(r => { setItems(r.data.items); setTotal(r.data.total) })
  }

  useEffect(() => { load() }, [page, search, statusFilter])
  useEffect(() => { api.get('/products', { params: { limit: 100 } }).then(r => setProducts(r.data.items)) }, [])
  useEffect(() => { api.get('/customers', { params: { limit: 200 } }).then(r => setCustomers(r.data.items)) }, [])

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { product_id: '', quantity: 1 }] }))
  const removeItem = i => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }))
  const updateItem = (i, key, val) => setForm(f => { const items = [...f.items]; items[i] = { ...items[i], [key]: val }; return { ...f, items } })

  const handleSave = async () => {
    if (!form.customer_name || form.items.length === 0) return toast.error('Müşteri adı ve en az bir ürün gerekli')
    try {
      const payload = { ...form, items: form.items.map(i => ({ product_id: Number(i.product_id), quantity: Number(i.quantity) })) }
      if (form.customer_id) payload.customer_id = Number(form.customer_id)
      await api.post('/orders', payload)
      toast.success('Sipariş oluşturuldu'); setModal(null); load()
    } catch (e) { toast.error(e.response?.data?.detail || 'Hata') }
  }

  const sendToProduction = async id => {
    try { await api.post(`/orders/${id}/send-to-production`); toast.success('Üretime alındı'); load() }
    catch (e) { toast.error(e.response?.data?.detail || 'Hata') }
  }

  const completeOrder = async id => {
    try { await api.post(`/orders/${id}/complete`); toast.success('Tamamlandı'); load() }
    catch (e) { toast.error(e.response?.data?.detail || 'Hata') }
  }

  const handleDelete = async id => {
    if (!confirm('Silmek istediğinize emin misiniz?')) return
    try { await api.delete(`/orders/${id}`); toast.success('Silindi'); load() }
    catch (e) { toast.error('Hata') }
  }

  const downloadInvoice = async (id) => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/invoices/${id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `fatura_${String(id).padStart(5,'0')}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch { toast.error('Fatura oluşturulamadı') }
  }

  const shipOrder = async id => {
    try {
      const res = await api.post(`/orders/${id}/ship`)
      if (res.data.payment_auto_created) toast.success('Sevkiyata alındı — vade kaydı otomatik oluşturuldu')
      else toast.success('Sevkiyata alındı')
      load()
    } catch (e) { toast.error(e.response?.data?.detail || 'Hata') }
  }

  const columns = [
    { key: 'id', label: '#', render: r => `#${r.id}` },
    { key: 'customer_name', label: 'Müşteri' },
    { key: 'items', label: 'Ürünler', render: r => r.items.map(i => i.product_name).join(', ') || '-' },
    { key: 'total_value', label: 'Tutar', render: r => `₺${r.total_value?.toFixed(2)}` },
    { key: 'status', label: 'Durum', render: r => statusBadge(r.status) },
    { key: 'created_at', label: 'Tarih', render: r => new Date(r.created_at).toLocaleDateString('tr-TR') },
    { key: 'actions', label: '', render: r => (
      <div className="flex gap-1">
        <button onClick={() => setViewOrder(r)} className="text-blue-600 hover:text-blue-800 p-1"><Eye size={14} /></button>
        <button onClick={() => downloadInvoice(r.id)} className="text-purple-600 hover:text-purple-800 p-1" title="Fatura İndir"><FileText size={14} /></button>
        {r.status === 'pending' && <button onClick={() => sendToProduction(r.id)} className="text-orange-500 hover:text-orange-700 p-1" title="Üretime Al"><Factory size={14} /></button>}
        {r.status === 'in_production' && <button onClick={() => completeOrder(r.id)} className="text-green-600 hover:text-green-800 p-1 text-xs font-medium" title="Tamamla">✓</button>}
        {(r.status === 'completed' || r.status === 'in_production') && <button onClick={() => shipOrder(r.id)} className="text-purple-600 hover:text-purple-800 p-1" title="Sevkiyata Al"><Truck size={14} /></button>}
        <button onClick={() => handleDelete(r.id)} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={14} /></button>
      </div>
    )}
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Siparişler</h1>
        <div className="flex gap-2">
          <button onClick={() => downloadExcel('orders', 'siparisler.xlsx').catch(() => toast.error('Hata'))}
            className="flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 text-sm">
            <Download size={15} /> Excel
          </button>
          <button onClick={() => { setForm(emptyForm); setModal('create') }} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
            <Plus size={16} /> Yeni Sipariş
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4 flex gap-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
          <input placeholder="Müşteri ara..." className="pl-9 border rounded-lg px-3 py-2 text-sm w-56"
            value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
        </div>
        <select className="border rounded-lg px-3 py-2 text-sm" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">Tüm Durumlar</option>
          <option value="pending">Bekliyor</option>
          <option value="in_production">Üretimde</option>
          <option value="completed">Tamamlandı</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <Table columns={columns} data={items} />
        <Pagination page={page} total={total} limit={limit} onChange={setPage} />
      </div>

      {modal === 'create' && (
        <Modal title="Yeni Sipariş" onClose={() => setModal(null)}>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Kayıtlı Müşteri Seç (opsiyonel)</label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.customer_id}
                onChange={e => {
                  const c = customers.find(c => c.id === Number(e.target.value))
                  if (c) setForm(f => ({ ...f, customer_id: c.id, customer_name: c.name, customer_phone: c.phone || '', customer_email: c.email || '' }))
                  else setForm(f => ({ ...f, customer_id: '' }))
                }}>
                <option value="">-- Seçiniz --</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            {[['customer_name','Müşteri Adı'],['customer_phone','Telefon'],['customer_email','Email'],['notes','Notlar']].map(([k,l]) => (
              <div key={k}>
                <label className="block text-sm font-medium mb-1">{l}</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm" value={form[k]} onChange={e => setForm({...form,[k]:e.target.value})} />
              </div>
            ))}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Ürünler</label>
                <button onClick={addItem} className="text-xs text-blue-600 hover:underline flex items-center gap-1"><Plus size={12} /> Ekle</button>
              </div>
              {form.items.map((item, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <select className="flex-1 border rounded-lg px-2 py-1.5 text-sm" value={item.product_id} onChange={e => updateItem(i, 'product_id', e.target.value)}>
                    <option value="">Ürün seç</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name} - ₺{p.sale_price}</option>)}
                  </select>
                  <input type="number" min="1" placeholder="Adet" className="w-20 border rounded-lg px-2 py-1.5 text-sm" value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} />
                  <button onClick={() => removeItem(i)} className="text-red-500"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleSave} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 text-sm">Kaydet</button>
            <button onClick={() => setModal(null)} className="flex-1 border py-2 rounded-lg text-sm">İptal</button>
          </div>
        </Modal>
      )}

      {viewOrder && (
        <Modal title={`Sipariş #${viewOrder.id} - ${viewOrder.customer_name}`} onClose={() => setViewOrder(null)}>
          <div className="space-y-2 mb-4 text-sm">
            <p><span className="text-gray-500">Durum:</span> {statusBadge(viewOrder.status)}</p>
            {viewOrder.customer_phone && <p><span className="text-gray-500">Tel:</span> {viewOrder.customer_phone}</p>}
            {viewOrder.customer_email && <p><span className="text-gray-500">Email:</span> {viewOrder.customer_email}</p>}
          </div>
          <table className="w-full text-sm">
            <thead><tr className="border-b"><th className="text-left py-2">Ürün</th><th className="text-right py-2">Adet</th><th className="text-right py-2">Fiyat</th><th className="text-right py-2">Toplam</th></tr></thead>
            <tbody>
              {viewOrder.items.map(item => (
                <tr key={item.id} className="border-b">
                  <td className="py-2">{item.product_name}</td>
                  <td className="text-right">{item.quantity}</td>
                  <td className="text-right">₺{item.unit_price}</td>
                  <td className="text-right">₺{(item.quantity * item.unit_price).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot><tr><td colSpan={3} className="pt-3 font-semibold">Toplam</td><td className="text-right pt-3 font-bold">₺{viewOrder.total_value?.toFixed(2)}</td></tr></tfoot>
          </table>
        </Modal>
      )}
    </div>
  )
}
