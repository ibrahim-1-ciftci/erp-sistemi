import { useEffect, useState } from 'react'
import api from '../api/axios'
import { downloadExcel } from '../api/axios'
import toast from 'react-hot-toast'
import Table from '../components/Table'
import Modal from '../components/Modal'
import Pagination from '../components/Pagination'
import { Plus, Search, Eye, Trash2, Edit2, User, Download } from 'lucide-react'

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
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState(null)
  const [viewCustomer, setViewCustomer] = useState(null)
  const limit = 15

  const load = () => {
    api.get('/customers', { params: { skip: (page - 1) * limit, limit, search } })
      .then(r => { setItems(r.data.items); setTotal(r.data.total) })
  }

  useEffect(() => { load() }, [page, search])

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
      if (editId) {
        await api.put(`/customers/${editId}`, form)
        toast.success('Güncellendi')
      } else {
        await api.post('/customers', form)
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
            <Download size={15} /> Excel
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
    </div>
  )
}
