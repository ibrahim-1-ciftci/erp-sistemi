import { useEffect, useState } from 'react'
import api from '../api/axios'
import { downloadExcel } from '../api/axios'
import toast from 'react-hot-toast'
import Table from '../components/Table'
import Modal from '../components/Modal'
import Pagination from '../components/Pagination'
import { Plus, Search, Edit2, Trash2, TrendingUp, Download } from 'lucide-react'

const emptyForm = { name: '', unit: 'kg', stock_quantity: 0, min_stock_level: 0, purchase_price: 0, supplier_id: '' }

export default function RawMaterials() {
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [suppliers, setSuppliers] = useState([])
  const [modal, setModal] = useState(null) // null | 'create' | 'edit' | 'adjust'
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [adjustQty, setAdjustQty] = useState(0)
  const [unitList, setUnitList] = useState(['kg','g','ton','lt','ml','adet','kutu','paket','metre','cm'])
  const [defaultUnit, setDefaultUnit] = useState('kg')
  const limit = 15

  const load = () => {
    api.get('/raw-materials', { params: { skip: (page - 1) * limit, limit, search } })
      .then(r => { setItems(r.data.items); setTotal(r.data.total) })
  }

  useEffect(() => { load() }, [page, search])
  useEffect(() => { api.get('/suppliers', { params: { limit: 100 } }).then(r => setSuppliers(r.data.items)) }, [])
  useEffect(() => {
    api.get('/settings').then(r => {
      const du = r.data.default_unit || 'kg'
      const ul = (r.data.weight_units || 'kg,g,ton,lt,ml,adet,kutu,paket,metre,cm').split(',').filter(Boolean)
      setDefaultUnit(du)
      setUnitList(ul)
      setForm(f => ({ ...f, unit: du }))
    })
  }, [])

  const openCreate = () => { setForm({ ...emptyForm, unit: defaultUnit }); setModal('create') }
  const openEdit = row => { setSelected(row); setForm({ ...row, supplier_id: row.supplier_id || '' }); setModal('edit') }
  const openAdjust = row => { setSelected(row); setAdjustQty(0); setModal('adjust') }

  const handleSave = async () => {
    try {
      const payload = { ...form, supplier_id: form.supplier_id || null }
      if (modal === 'create') await api.post('/raw-materials', payload)
      else await api.put(`/raw-materials/${selected.id}`, payload)
      toast.success('Kaydedildi')
      setModal(null); load()
    } catch (e) { toast.error(e.response?.data?.detail || 'Hata') }
  }

  const handleAdjust = async () => {
    try {
      await api.post(`/raw-materials/${selected.id}/adjust-stock`, { quantity: Number(adjustQty) })
      toast.success('Stok güncellendi')
      setModal(null); load()
    } catch (e) { toast.error(e.response?.data?.detail || 'Hata') }
  }

  const handleDelete = async id => {
    if (!confirm('Silmek istediğinize emin misiniz?')) return
    try { await api.delete(`/raw-materials/${id}`); toast.success('Silindi'); load() }
    catch (e) { toast.error(e.response?.data?.detail || 'Hata') }
  }

  const columns = [
    { key: 'name', label: 'Ad' },
    { key: 'unit', label: 'Birim' },
    { key: 'stock_quantity', label: 'Stok', render: r => (
      <span className={r.is_low_stock ? 'text-red-600 font-bold' : ''}>{r.stock_quantity} {r.unit}</span>
    )},
    { key: 'min_stock_level', label: 'Min Stok', render: r => `${r.min_stock_level} ${r.unit}` },
    { key: 'purchase_price', label: 'Alış Fiyatı', render: r => `₺${r.purchase_price}` },
    { key: 'supplier_name', label: 'Tedarikçi', render: r => r.supplier_name || '-' },
    { key: 'actions', label: '', render: r => (
      <div className="flex gap-2">
        <button onClick={() => openAdjust(r)} className="text-green-600 hover:text-green-800"><TrendingUp size={15} /></button>
        <button onClick={() => openEdit(r)} className="text-blue-600 hover:text-blue-800"><Edit2 size={15} /></button>
        <button onClick={() => handleDelete(r.id)} className="text-red-500 hover:text-red-700"><Trash2 size={15} /></button>
      </div>
    )}
  ]

  const FormFields = (
    <div className="space-y-3">
      {[['name','Ad','text'],['stock_quantity','Stok Miktarı','number'],['min_stock_level','Min Stok','number'],['purchase_price','Alış Fiyatı (₺)','number']].map(([k,l,t]) => (
        <div key={k}>
          <label className="block text-sm font-medium mb-1">{l}</label>
          <input type={t} className="w-full border rounded-lg px-3 py-2 text-sm" value={form[k]} onChange={e => setForm({...form,[k]:e.target.value})} />
        </div>
      ))}
      <div>
        <label className="block text-sm font-medium mb-1">Birim</label>
        <div className="flex gap-2">
          <select className="flex-1 border rounded-lg px-3 py-2 text-sm" value={form.unit} onChange={e => setForm({...form, unit: e.target.value})}>
            {unitList.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
          <input className="w-24 border rounded-lg px-3 py-2 text-sm" placeholder="Özel..." value={unitList.includes(form.unit) ? '' : form.unit}
            onChange={e => setForm({...form, unit: e.target.value})} />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Tedarikçi</label>
        <select className="w-full border rounded-lg px-3 py-2 text-sm" value={form.supplier_id} onChange={e => setForm({...form, supplier_id: e.target.value})}>
          <option value="">Seçiniz</option>
          {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Hammaddeler</h1>
        <div className="flex gap-2">
          <button onClick={() => downloadExcel('raw-materials', 'hammaddeler.xlsx').catch(() => toast.error('Hata'))}
            className="flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 text-sm">
            <Download size={15} /> Excel
          </button>
          <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
            <Plus size={16} /> Yeni Hammadde
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

      {(modal === 'create' || modal === 'edit') && (
        <Modal title={modal === 'create' ? 'Yeni Hammadde' : 'Hammadde Düzenle'} onClose={() => setModal(null)}>
          {FormFields}
          <div className="flex gap-2 mt-4">
            <button onClick={handleSave} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 text-sm">Kaydet</button>
            <button onClick={() => setModal(null)} className="flex-1 border py-2 rounded-lg text-sm">İptal</button>
          </div>
        </Modal>
      )}

      {modal === 'adjust' && (
        <Modal title={`Stok Güncelle: ${selected?.name}`} onClose={() => setModal(null)}>
          <p className="text-sm text-gray-500 mb-3">Mevcut: {selected?.stock_quantity} {selected?.unit}</p>
          <label className="block text-sm font-medium mb-1">Miktar (+ ekle, - çıkar)</label>
          <input type="number" className="w-full border rounded-lg px-3 py-2 text-sm" value={adjustQty} onChange={e => setAdjustQty(e.target.value)} />
          <div className="flex gap-2 mt-4">
            <button onClick={handleAdjust} className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 text-sm">Güncelle</button>
            <button onClick={() => setModal(null)} className="flex-1 border py-2 rounded-lg text-sm">İptal</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
