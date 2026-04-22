import { useEffect, useState } from 'react'
import api from '../api/axios'
import { downloadExcel } from '../api/axios'
import toast from 'react-hot-toast'
import Table from '../components/Table'
import Modal from '../components/Modal'
import Pagination from '../components/Pagination'
import { Plus, Search, Eye, Trash2, Factory, FileText, Truck, Download, ArchiveRestore, ClipboardList, Edit2 } from 'lucide-react'

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
  const [tab, setTab] = useState('active') // 'active' | 'archive'
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [products, setProducts] = useState([])
  const [customers, setCustomers] = useState([])
  const [modal, setModal] = useState(null)
  const [viewOrder, setViewOrder] = useState(null)
  const [deliveryNote, setDeliveryNote] = useState(null)   // görüntüleme/düzenleme
  const [dnForm, setDnForm] = useState({})                  // düzenleme formu
  const [form, setForm] = useState(emptyForm)
  const [shipModal, setShipModal] = useState(null) // { orderId, totalValue, customerName }
  const [shipVadeForm, setShipVadeForm] = useState({ due_days: 30, create_vade: false })
  const [editOrder, setEditOrder] = useState(null)
  const limit = 15

  const load = () => {
    const statusParam = tab === 'archive' ? 'shipped' : (statusFilter || undefined)
    const excludeParam = tab === 'active' && !statusFilter ? 'shipped' : undefined
    api.get('/orders', { params: {
      skip: (page - 1) * limit, limit, search,
      status: statusParam, exclude_status: excludeParam,
      date_from: dateFrom || undefined, date_to: dateTo || undefined
    }}).then(r => { setItems(r.data.items); setTotal(r.data.total) })
  }

  useEffect(() => { load() }, [page, search, statusFilter, tab, dateFrom, dateTo])
  useEffect(() => { api.get('/products', { params: { limit: 100 } }).then(r => setProducts(r.data.items)) }, [])
  useEffect(() => { api.get('/customers', { params: { limit: 200 } }).then(r => setCustomers(r.data.items)) }, [])

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { product_id: '', quantity: 1, unit_price: '' }] }))
  const removeItem = i => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }))
  const updateItem = (i, key, val) => setForm(f => { const items = [...f.items]; items[i] = { ...items[i], [key]: val }; return { ...f, items } })

  const updateItemProduct = async (i, productId) => {
    const newItems = [...form.items]
    newItems[i] = { ...newItems[i], product_id: productId, unit_price: '' }
    // Müşteri seçiliyse özel fiyatı getir
    if (form.customer_id && productId) {
      try {
        const res = await api.get(`/customers/${form.customer_id}/price-for/${productId}`)
        newItems[i].unit_price = res.data.effective_price
        if (res.data.custom_price) {
          toast.success(`Özel fiyat uygulandı: ₺${res.data.custom_price}`, { duration: 2000 })
        }
      } catch {}
    } else if (productId) {
      // Müşteri seçili değilse standart fiyatı al
      const product = products.find(p => p.id === Number(productId))
      if (product) newItems[i].unit_price = product.sale_price
    }
    setForm(f => ({ ...f, items: newItems }))
  }

  // Müşteri değiştiğinde mevcut ürünlerin fiyatlarını güncelle
  const handleCustomerChange = async (customerId) => {
    if (!customerId) {
      // Müşteri seçimi temizlendi — sadece customer_id'yi sıfırla, diğer alanları koru
      setForm(f => ({ ...f, customer_id: '' }))
      return
    }
    const c = customers.find(c => c.id === Number(customerId))
    if (!c) return
    const updatedItems = [...form.items]
    for (let i = 0; i < updatedItems.length; i++) {
      if (updatedItems[i].product_id) {
        try {
          const res = await api.get(`/customers/${c.id}/price-for/${updatedItems[i].product_id}`)
          updatedItems[i] = { ...updatedItems[i], unit_price: res.data.effective_price }
        } catch {}
      }
    }
    setForm(f => ({ ...f, customer_id: c.id, customer_name: c.name, customer_phone: c.phone || '', customer_email: c.email || '', items: updatedItems }))
  }

  const handleSave = async () => {
    if (!form.customer_name || form.items.length === 0) return toast.error('Müşteri adı ve en az bir ürün gerekli')
    try {
      // unit_price'ı da payload'a ekle — özel fiyat korunur
      const payload = {
        ...form,
        items: form.items.map(i => ({
          product_id: Number(i.product_id),
          quantity: Number(i.quantity),
          unit_price: i.unit_price ? Number(i.unit_price) : undefined
        }))
      }
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
      const res = await fetch(`/api/invoices/${id}/pdf`, { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `fatura_${String(id).padStart(5,'0')}.pdf`; a.click()
      URL.revokeObjectURL(url)
    } catch { toast.error('Fatura oluşturulamadı') }
  }

  const shipOrder = async (id, skipModal = false) => {
    try {
      const res = await api.post(`/orders/${id}/ship`)
      if (res.data.payment_auto_created) {
        toast.success('Sevkiyata alındı — vade kaydı otomatik oluşturuldu')
        load()
      } else if (!skipModal) {
        // Müşteriye vade tanımlı değil — manuel vade seçeneği sun
        const order = items.find(o => o.id === id)
        setShipModal({ orderId: id, totalValue: order?.total_value || 0, customerName: order?.customer_name || '' })
        setShipVadeForm({ due_days: 30, create_vade: false })
        load()
      } else {
        toast.success('Sevkiyata alındı')
        load()
      }
    } catch (e) { toast.error(e.response?.data?.detail || 'Hata') }
  }

  const handleShipWithVade = async () => {
    if (shipVadeForm.create_vade) {
      // Manuel vade kaydı oluştur
      const order = items.find(o => o.id === shipModal.orderId) ||
                    { total_value: shipModal.totalValue, customer_name: shipModal.customerName, items: [] }
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + Number(shipVadeForm.due_days))
      try {
        await api.post('/payments', {
          order_id: shipModal.orderId,
          customer_name_override: shipModal.customerName,
          order_date: new Date().toISOString().split('T')[0],
          total_amount: shipModal.totalValue,
          due_date: dueDate.toISOString().split('T')[0],
          notes: `Manuel vade — ${shipVadeForm.due_days} gün`,
        })
        toast.success(`Sevkiyata alındı — ${shipVadeForm.due_days} günlük vade kaydı oluşturuldu`)
      } catch { toast.error('Vade kaydı oluşturulamadı') }
    } else {
      toast.success('Sevkiyata alındı (vade kaydı oluşturulmadı)')
    }
    setShipModal(null)
  }

  // Arşivden geri al — shipped → completed
  const unarchiveOrder = async id => {
    try {
      await api.put(`/orders/${id}`, { status: 'completed' })
      toast.success('Sipariş arşivden çıkarıldı')
      load()
    } catch (e) { toast.error(e.response?.data?.detail || 'Hata') }
  }

  const openEditOrder = (order) => {
    setEditOrder(order)
    setForm({
      customer_id: order.customer_id || '',
      customer_name: order.customer_name,
      customer_phone: order.customer_phone || '',
      customer_email: order.customer_email || '',
      notes: order.notes || '',
      items: order.items.map(i => ({
        product_id: i.product_id,
        quantity: i.quantity,
        unit_price: i.unit_price
      }))
    })
    setModal('edit')
  }

  const handleEdit = async () => {
    if (!form.customer_name || form.items.length === 0) return toast.error('Müşteri adı ve en az bir ürün gerekli')
    try {
      await api.put(`/orders/${editOrder.id}`, {
        customer_name: form.customer_name,
        customer_phone: form.customer_phone,
        customer_email: form.customer_email,
        notes: form.notes,
      })
      toast.success('Sipariş güncellendi'); setModal(null); setEditOrder(null); load()
    } catch (e) { toast.error(e.response?.data?.detail || 'Hata') }
  }

  // Teslimat fişi aç
  const openDeliveryNote = async (orderId) => {
    try {
      const res = await api.get(`/delivery-notes/order/${orderId}`)
      setDeliveryNote(res.data)
      setDnForm({
        delivery_address: res.data.delivery_address || '',
        driver_name:      res.data.driver_name || '',
        driver_phone:     res.data.driver_phone || '',
        plate:            res.data.plate || '',
        receiver_name:    res.data.receiver_name || '',
        receiver_title:   res.data.receiver_title || '',
        notes:            res.data.notes || '',
      })
      setModal('delivery')
    } catch { toast.error('Teslimat fişi bulunamadı') }
  }

  const saveDn = async () => {
    try {
      await api.put(`/delivery-notes/${deliveryNote.id}`, dnForm)
      toast.success('Teslimat fişi güncellendi')
      setModal(null)
    } catch { toast.error('Hata') }
  }

  const downloadDnPdf = async (noteId) => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/delivery-notes/${noteId}/pdf`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `irsaliye_${noteId}.pdf`; a.click()
      URL.revokeObjectURL(url)
    } catch { toast.error('PDF oluşturulamadı') }
  }

  const activeColumns = [
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
        <button onClick={() => openEditOrder(r)} className="text-gray-500 hover:text-gray-700 p-1" title="Düzenle"><Edit2 size={14} /></button>
        {r.status === 'pending' && <button onClick={() => sendToProduction(r.id)} className="text-orange-500 hover:text-orange-700 p-1" title="Üretime Al"><Factory size={14} /></button>}
        {r.status === 'in_production' && <button onClick={() => completeOrder(r.id)} className="text-green-600 hover:text-green-800 p-1 text-xs font-medium" title="Tamamla">✓</button>}
        {(r.status === 'completed' || r.status === 'in_production') && <button onClick={() => shipOrder(r.id)} className="text-purple-600 hover:text-purple-800 p-1" title="Sevkiyata Al"><Truck size={14} /></button>}
        <button onClick={() => handleDelete(r.id)} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={14} /></button>
      </div>
    )}
  ]

  const archiveColumns = [
    { key: 'id', label: '#', render: r => `#${r.id}` },
    { key: 'customer_name', label: 'Müşteri' },
    { key: 'items', label: 'Ürünler', render: r => r.items.map(i => i.product_name).join(', ') || '-' },
    { key: 'total_value', label: 'Tutar', render: r => `₺${r.total_value?.toFixed(2)}` },
    { key: 'shipped_at', label: 'Sevk Tarihi', render: r => r.shipped_at ? new Date(r.shipped_at).toLocaleDateString('tr-TR') : '-' },
    { key: 'actions', label: '', render: r => (
      <div className="flex gap-1">
        <button onClick={() => setViewOrder(r)} className="text-blue-600 hover:text-blue-800 p-1"><Eye size={14} /></button>
        <button onClick={() => downloadInvoice(r.id)} className="text-purple-600 hover:text-purple-800 p-1" title="Fatura İndir"><FileText size={14} /></button>
        <button onClick={() => openDeliveryNote(r.id)} className="text-teal-600 hover:text-teal-800 p-1" title="Teslimat Fişi"><ClipboardList size={14} /></button>
        <button onClick={() => unarchiveOrder(r.id)} className="text-orange-500 hover:text-orange-700 p-1" title="Arşivden Çıkar"><ArchiveRestore size={14} /></button>
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
          {tab === 'active' && (
            <button onClick={() => { setForm(emptyForm); setModal('create') }} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
              <Plus size={16} /> Yeni Sipariş
            </button>
          )}
        </div>
      </div>

      {/* Aktif / Arşiv sekmeleri */}
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1 w-fit">
        <button onClick={() => { setTab('active'); setStatusFilter(''); setPage(1) }}
          className={`px-5 py-2 rounded-md text-sm font-medium transition-all ${tab === 'active' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
          Aktif Siparişler
        </button>
        <button onClick={() => { setTab('archive'); setStatusFilter(''); setPage(1) }}
          className={`px-5 py-2 rounded-md text-sm font-medium transition-all ${tab === 'archive' ? 'bg-white shadow text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}>
          Sevkiyat Arşivi
        </button>
      </div>

      {tab === 'active' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4 flex flex-wrap gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
            <input placeholder="Müşteri ara..." className="pl-9 border rounded-lg px-3 py-2 text-sm w-48"
              value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
          </div>
          <select className="border rounded-lg px-3 py-2 text-sm" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">Tüm Aktifler</option>
            <option value="pending">Bekliyor</option>
            <option value="in_production">Üretimde</option>
            <option value="completed">Tamamlandı</option>
          </select>
          <input type="date" className="border rounded-lg px-3 py-2 text-sm" value={dateFrom}
            onChange={e => { setDateFrom(e.target.value); setPage(1) }} title="Başlangıç tarihi" />
          <span className="text-gray-400 self-center text-sm">—</span>
          <input type="date" className="border rounded-lg px-3 py-2 text-sm" value={dateTo}
            onChange={e => { setDateTo(e.target.value); setPage(1) }} title="Bitiş tarihi" />
          {(dateFrom || dateTo) && (
            <button onClick={() => { setDateFrom(''); setDateTo(''); setPage(1) }}
              className="text-xs text-blue-600 hover:underline self-center">Tarihi Temizle</button>
          )}
        </div>
      )}

      {tab === 'archive' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4 flex flex-wrap gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
            <input placeholder="Müşteri ara..." className="pl-9 border rounded-lg px-3 py-2 text-sm w-48"
              value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
          </div>
          <input type="date" className="border rounded-lg px-3 py-2 text-sm" value={dateFrom}
            onChange={e => { setDateFrom(e.target.value); setPage(1) }} title="Başlangıç tarihi" />
          <span className="text-gray-400 self-center text-sm">—</span>
          <input type="date" className="border rounded-lg px-3 py-2 text-sm" value={dateTo}
            onChange={e => { setDateTo(e.target.value); setPage(1) }} title="Bitiş tarihi" />
          {(dateFrom || dateTo) && (
            <button onClick={() => { setDateFrom(''); setDateTo(''); setPage(1) }}
              className="text-xs text-blue-600 hover:underline self-center">Tarihi Temizle</button>
          )}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <Table columns={tab === 'active' ? activeColumns : archiveColumns} data={items} />
        <Pagination page={page} total={total} limit={limit} onChange={setPage} />
      </div>

      {modal === 'create' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="rounded-xl shadow-xl w-full max-w-4xl max-h-[95vh] flex flex-col"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border)' }}>
              <div>
                <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Yeni Sipariş</h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Müşteri bilgilerini ve sipariş kalemlerini doldurun</p>
              </div>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>

            <div className="overflow-y-auto flex-1 p-5">
              <div className="grid grid-cols-2 gap-6">
                {/* Sol kolon — Müşteri bilgileri */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>Müşteri Bilgileri</h3>

                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Kayıtlı Müşteri Seç</label>
                    <select className="w-full border rounded-lg px-3 py-2 text-sm"
                      style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                      value={form.customer_id} onChange={e => handleCustomerChange(e.target.value)}>
                      <option value="">-- Seçiniz (opsiyonel) --</option>
                      {customers.map(c => <option key={c.id} value={c.id}>{c.name}{c.payment_term_days ? ` (${c.payment_term_days}g vade)` : ''}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Müşteri Adı *</label>
                      <input className="w-full border rounded-lg px-3 py-2 text-sm"
                        style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                        value={form.customer_name} onChange={e => setForm({...form, customer_name: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Telefon</label>
                      <input className="w-full border rounded-lg px-3 py-2 text-sm"
                        style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                        value={form.customer_phone} onChange={e => setForm({...form, customer_phone: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>E-posta</label>
                      <input type="email" className="w-full border rounded-lg px-3 py-2 text-sm"
                        style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                        value={form.customer_email} onChange={e => setForm({...form, customer_email: e.target.value})} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Teslimat Adresi</label>
                    <textarea rows={2} className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
                      style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                      value={form.delivery_address || ''} onChange={e => setForm({...form, delivery_address: e.target.value})}
                      placeholder="Teslimat adresi (opsiyonel)" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Sipariş Notu</label>
                    <textarea rows={3} className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
                      style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                      value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}
                      placeholder="Özel talepler, teslimat notu vb." />
                  </div>

                  {/* Özet */}
                  {form.items.length > 0 && (
                    <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--bg-table-head)', border: '1px solid var(--border)' }}>
                      <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>SİPARİŞ ÖZETİ</p>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span style={{ color: 'var(--text-secondary)' }}>Kalem sayısı:</span>
                          <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{form.items.filter(i => i.product_id).length}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span style={{ color: 'var(--text-secondary)' }}>Toplam tutar:</span>
                          <span className="font-bold" style={{ color: 'var(--accent)' }}>
                            ₺{form.items.reduce((s, i) => s + (Number(i.quantity)||0) * (Number(i.unit_price)||0), 0).toLocaleString('tr-TR', {minimumFractionDigits:2})}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Sağ kolon — Ürünler */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>Sipariş Kalemleri</h3>
                    <button onClick={addItem} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg"
                      style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-text)' }}>
                      <Plus size={12} /> Kalem Ekle
                    </button>
                  </div>

                  {form.items.length === 0 && (
                    <div className="rounded-lg p-6 text-center border-2 border-dashed" style={{ borderColor: 'var(--border)' }}>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Henüz ürün eklenmedi</p>
                      <button onClick={addItem} className="mt-2 text-xs" style={{ color: 'var(--accent)' }}>+ İlk kalemi ekle</button>
                    </div>
                  )}

                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {form.items.map((item, i) => (
                      <div key={i} className="rounded-lg p-3 border" style={{ backgroundColor: 'var(--bg-table-head)', borderColor: 'var(--border)' }}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: 'var(--accent)' }}>{i+1}</span>
                          <select className="flex-1 border rounded-lg px-2 py-1.5 text-sm"
                            style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                            value={item.product_id} onChange={e => updateItemProduct(i, e.target.value)}>
                            <option value="">Ürün seçin...</option>
                            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                          <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600 p-1 shrink-0"><Trash2 size={14} /></button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Miktar</label>
                            <input type="number" min="1" className="w-full border rounded px-2 py-1.5 text-sm"
                              style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                              value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} />
                          </div>
                          <div>
                            <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Birim Fiyat</label>
                            <input type="number" min="0" step="0.01" className="w-full border rounded px-2 py-1.5 text-sm"
                              style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                              value={item.unit_price} onChange={e => updateItem(i, 'unit_price', e.target.value)} />
                          </div>
                          <div>
                            <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Toplam</label>
                            <div className="border rounded px-2 py-1.5 text-sm font-medium" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--accent)' }}>
                              ₺{((Number(item.quantity)||0) * (Number(item.unit_price)||0)).toLocaleString('tr-TR', {minimumFractionDigits:2})}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-5 border-t" style={{ borderColor: 'var(--border)' }}>
              <button onClick={handleSave} className="flex-1 py-2.5 rounded-lg text-sm font-semibold"
                style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-text)' }}>
                Siparişi Oluştur
              </button>
              <button onClick={() => setModal(null)} className="px-6 py-2.5 rounded-lg text-sm border"
                style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sipariş Düzenle Modalı */}
      {modal === 'edit' && editOrder && (
        <Modal title={`Sipariş Düzenle #${editOrder.id}`} onClose={() => { setModal(null); setEditOrder(null) }}>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Müşteri Adı *</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.customer_name} onChange={e => setForm({...form, customer_name: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Telefon</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm"
                  value={form.customer_phone} onChange={e => setForm({...form, customer_phone: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">E-posta</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm"
                  value={form.customer_email} onChange={e => setForm({...form, customer_email: e.target.value})} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Notlar</label>
              <textarea rows={2} className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
                value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-gray-500 mb-2">ÜRÜNLER (değiştirilemez)</p>
              {editOrder.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm py-1">
                  <span>{item.product_name}</span>
                  <span className="text-gray-500">{item.quantity} adet · ₺{item.unit_price?.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleEdit} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 text-sm">Kaydet</button>
            <button onClick={() => { setModal(null); setEditOrder(null) }} className="flex-1 border py-2 rounded-lg text-sm">İptal</button>
          </div>
        </Modal>
      )}

      {/* Sevkiyat Vade Modalı */}
      {shipModal && (        <Modal title={`Sevkiyat — ${shipModal.customerName}`} onClose={() => setShipModal(null)}>
          <div className="space-y-4">
            <div className="rounded-lg p-3 text-sm" style={{ backgroundColor: 'var(--bg-table-head)', border: '1px solid var(--border)' }}>
              <p style={{ color: 'var(--text-secondary)' }}>Bu müşteri için otomatik vade tanımlı değil.</p>
              <p className="font-medium mt-1" style={{ color: 'var(--text-primary)' }}>
                Sipariş tutarı: ₺{shipModal.totalValue?.toFixed(2)}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <input type="checkbox" id="create_vade" className="w-4 h-4 cursor-pointer"
                checked={shipVadeForm.create_vade}
                onChange={e => setShipVadeForm(f => ({ ...f, create_vade: e.target.checked }))} />
              <label htmlFor="create_vade" className="text-sm font-medium cursor-pointer"
                style={{ color: 'var(--text-primary)' }}>
                Vade kaydı oluştur
              </label>
            </div>

            {shipVadeForm.create_vade && (
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                  Vade Günü
                </label>
                <div className="flex items-center gap-3">
                  <input type="number" min="1" max="365"
                    className="w-28 border rounded-lg px-3 py-2 text-sm"
                    value={shipVadeForm.due_days}
                    onChange={e => setShipVadeForm(f => ({ ...f, due_days: e.target.value }))} />
                  <div className="flex gap-1">
                    {[15, 30, 45, 60, 90].map(d => (
                      <button key={d} type="button"
                        onClick={() => setShipVadeForm(f => ({ ...f, due_days: d }))}
                        className="text-xs px-2 py-1 rounded border"
                        style={shipVadeForm.due_days == d
                          ? { backgroundColor: 'var(--accent)', color: 'var(--accent-text)', borderColor: 'var(--accent)' }
                          : { color: 'var(--accent)', borderColor: 'var(--border)' }}>
                        {d}g
                      </button>
                    ))}
                  </div>
                </div>
                {shipVadeForm.due_days && (
                  <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                    Vade tarihi: {(() => {
                      const d = new Date(); d.setDate(d.getDate() + Number(shipVadeForm.due_days))
                      return d.toLocaleDateString('tr-TR')
                    })()}
                  </p>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-2 mt-5">
            <button onClick={handleShipWithVade}
              className="flex-1 py-2 rounded-lg text-sm font-medium"
              style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-text)' }}>
              {shipVadeForm.create_vade ? 'Sevket ve Vade Oluştur' : 'Sadece Sevket'}
            </button>
            <button onClick={() => setShipModal(null)} className="flex-1 border py-2 rounded-lg text-sm"
              style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
              İptal
            </button>
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
                  <td className="text-right">₺{(item.unit_price || 0).toFixed(2)}</td>
                  <td className="text-right">₺{((item.quantity || 0) * (item.unit_price || 0)).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot><tr><td colSpan={3} className="pt-3 font-semibold">Toplam</td><td className="text-right pt-3 font-bold">₺{viewOrder.total_value?.toFixed(2)}</td></tr></tfoot>
          </table>
        </Modal>
      )}

      {/* Teslimat Fişi Modalı */}
      {modal === 'delivery' && deliveryNote && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h2 className="text-lg font-semibold">Teslimat Fişi</h2>
                <p className="text-xs text-gray-500 mt-0.5">İrsaliye No: {deliveryNote.note_number}</p>
              </div>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>

            <div className="p-5 space-y-4">
              {/* Ürün listesi — salt okunur */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Ürünler</p>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left px-3 py-2 font-medium text-gray-600">Ürün</th>
                        <th className="text-right px-3 py-2 font-medium text-gray-600">Miktar</th>
                        <th className="text-right px-3 py-2 font-medium text-gray-600">Birim</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {deliveryNote.items.map((item, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2">{item.product_name}</td>
                          <td className="px-3 py-2 text-right">{item.quantity}</td>
                          <td className="px-3 py-2 text-right text-gray-500">{item.unit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Düzenlenebilir alanlar */}
              <div>
                <label className="block text-sm font-medium mb-1">Teslimat Adresi</label>
                <textarea rows={2} className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
                  value={dnForm.delivery_address}
                  onChange={e => setDnForm(f => ({ ...f, delivery_address: e.target.value }))}
                  placeholder="Teslimat adresi..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Sürücü Adı</label>
                  <input className="w-full border rounded-lg px-3 py-2 text-sm"
                    value={dnForm.driver_name}
                    onChange={e => setDnForm(f => ({ ...f, driver_name: e.target.value }))}
                    placeholder="Sürücü adı soyadı" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Sürücü Telefonu</label>
                  <input className="w-full border rounded-lg px-3 py-2 text-sm"
                    value={dnForm.driver_phone}
                    onChange={e => setDnForm(f => ({ ...f, driver_phone: e.target.value }))}
                    placeholder="05xx xxx xx xx" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Araç Plakası</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm"
                  value={dnForm.plate}
                  onChange={e => setDnForm(f => ({ ...f, plate: e.target.value }))}
                  placeholder="34 ABC 123" />
              </div>

              {/* Teslim Alan */}
              <div className="border-t pt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Teslim Alan Bilgileri</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Teslim Alan Kişi</label>
                    <input className="w-full border rounded-lg px-3 py-2 text-sm"
                      value={dnForm.receiver_name}
                      onChange={e => setDnForm(f => ({ ...f, receiver_name: e.target.value }))}
                      placeholder="Ad Soyad" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Unvan / Görev</label>
                    <input className="w-full border rounded-lg px-3 py-2 text-sm"
                      value={dnForm.receiver_title}
                      onChange={e => setDnForm(f => ({ ...f, receiver_title: e.target.value }))}
                      placeholder="Depo Sorumlusu vb." />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notlar</label>
                <textarea rows={2} className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
                  value={dnForm.notes}
                  onChange={e => setDnForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Ek notlar..." />
              </div>
            </div>

            <div className="flex gap-2 p-4 border-t">
              <button onClick={saveDn}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
                Kaydet
              </button>
              <button onClick={() => downloadDnPdf(deliveryNote.id)}
                className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 text-sm">
                <FileText size={14} /> PDF İndir
              </button>
              <button onClick={() => setModal(null)}
                className="flex-1 border py-2 rounded-lg text-sm">
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
