import { useEffect, useState } from 'react'
import api from '../api/axios'
import { downloadExcel } from '../api/axios'
import toast from 'react-hot-toast'
import Table from '../components/Table'
import Modal from '../components/Modal'
import Pagination from '../components/Pagination'
import { Plus, Search, Edit2, Trash2, Download } from 'lucide-react'

const emptyForm = { name: '', sale_price: 0, stock_quantity: 0 }

export default function Products() {
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const limit = 15

  const load = () => {
    api.get('/products', { params: { skip: (page - 1) * limit, limit, search } })
      .then(r => { setItems(r.data.items); setTotal(r.data.total) })
  }

  useEffect(() => { load() }, [page, search])

  const handleSave = async () => {
    try {
      if (modal === 'create') await api.post('/products', form)
      else await api.put(`/products/${selected.id}`, form)
      toast.success('Kaydedildi'); setModal(null); load()
    } catch (e) { toast.error(e.response?.data?.detail || 'Hata') }
  }

  const handleDelete = async id => {
    if (!confirm('Silmek istediğinize emin misiniz?')) return
    try { await api.delete(`/products/${id}`); toast.success('Silindi'); load() }
    catch (e) { toast.error(e.response?.data?.detail || 'Hata') }
  }

  const columns = [
    { key: 'name', label: 'Ürün Adı' },
    { key: 'sale_price', label: 'Satış Fiyatı', render: r => `₺${r.sale_price}` },
    { key: 'stock_quantity', label: 'Stok', render: r => `${r.stock_quantity} adet` },
    { key: 'created_at', label: 'Oluşturulma', render: r => new Date(r.created_at).toLocaleDateString('tr-TR') },
    { key: 'actions', label: '', render: r => (
      <div className="flex gap-2">
        <button onClick={() => { setSelected(r); setForm(r); setModal('edit') }} className="text-blue-600 hover:text-blue-800"><Edit2 size={15} /></button>
        <button onClick={() => handleDelete(r.id)} className="text-red-500 hover:text-red-700"><Trash2 size={15} /></button>
      </div>
    )}
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Ürünler</h1>
        <div className="flex gap-2">
          <button onClick={() => downloadExcel('products', 'urunler.xlsx').catch(() => toast.error('Hata'))}
            className="flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 text-sm">
            <Download size={15} /> Excel
          </button>
          <button onClick={() => { setForm(emptyForm); setModal('create') }} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
            <Plus size={16} /> Yeni Ürün
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
          <input placeholder="Ara..." className="pl-9 border rounded-lg px-3 py-2 text-sm w-64"
            value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <Table columns={columns} data={items} />
        <Pagination page={page} total={total} limit={limit} onChange={setPage} />
      </div>

      {modal && (
        <Modal title={modal === 'create' ? 'Yeni Ürün' : 'Ürün Düzenle'} onClose={() => setModal(null)}>
          <div className="space-y-3">
            {[['name','Ürün Adı','text'],['sale_price','Satış Fiyatı (₺)','number'],['stock_quantity','Stok Miktarı','number']].map(([k,l,t]) => (
              <div key={k}>
                <label className="block text-sm font-medium mb-1">{l}</label>
                <input type={t} className="w-full border rounded-lg px-3 py-2 text-sm" value={form[k]} onChange={e => setForm({...form,[k]:e.target.value})} />
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleSave} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 text-sm">Kaydet</button>
            <button onClick={() => setModal(null)} className="flex-1 border py-2 rounded-lg text-sm">İptal</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
