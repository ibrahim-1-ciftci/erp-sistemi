import { useEffect, useState } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'
import Modal from '../components/Modal'
import { Plus, Calendar, List, AlertTriangle, CheckCircle, Clock,
         ChevronLeft, ChevronRight, Download, Edit3, Trash2, X, ArchiveRestore, FileText, Eye, Edit2 } from 'lucide-react'

const STATUS = {
  pending: { label: 'Bekliyor',     cls: 'bg-yellow-100 text-yellow-700' },
  overdue: { label: 'Gecikmiş',     cls: 'bg-red-100 text-red-700' },
  partial: { label: 'Kısmi Ödeme', cls: 'bg-blue-100 text-blue-700' },
  paid:    { label: 'Ödendi',       cls: 'bg-green-100 text-green-700' },
}
const MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık']
const DAYS   = ['Pzt','Sal','Çar','Per','Cum','Cmt','Paz']

function Badge({ status }) {
  const s = STATUS[status] || STATUS.pending
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>{s.label}</span>
}

const emptyItem = { product_name: '', quantity: 1, unit: 'adet', unit_price: 0 }
const emptyForm = { order_id: '', customer_name: '', order_date: '', due_date: '', items: [{ ...emptyItem }], notes: '' }

export default function Payments() {
  const today = new Date()
  const [view, setView] = useState('list')
  const [tab, setTab] = useState('active') // 'active' | 'archive'
  const [payments, setPayments] = useState([])
  const [summary, setSummary] = useState({ total_pending: 0, overdue_count: 0 })
  const [calData, setCalData] = useState({})
  const [calYear, setCalYear] = useState(today.getFullYear())
  const [calMonth, setCalMonth] = useState(today.getMonth() + 1)
  const [orders, setOrders] = useState([])
  const [statusFilter, setStatusFilter] = useState('')
  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [payForm, setPayForm] = useState({ paid_amount: '', paid_date: today.toISOString().split('T')[0] })
  const [checkedIds, setCheckedIds] = useState(new Set())
  const [detailPayment, setDetailPayment] = useState(null)
  const [editPayment, setEditPayment] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [defaultUnit, setDefaultUnit] = useState('adet')
  const [unitList, setUnitList] = useState(['kg','g','ton','lt','ml','adet','kutu','paket','metre','cm'])

  useEffect(() => {
    api.get('/settings').then(r => {
      const du = r.data.default_unit || 'adet'
      const ul = (r.data.weight_units || 'kg,g,ton,lt,ml,adet,kutu,paket,metre,cm').split(',').filter(Boolean)
      setDefaultUnit(du)
      setUnitList(ul)
    }).catch(() => {})
  }, [])

  const loadList = () => {
    const statusParam = tab === 'archive' ? 'paid' : (statusFilter || undefined)
    api.get('/payments', { params: { status: statusParam } })
      .then(r => {
        let items = r.data.items
        if (tab === 'active' && !statusFilter) {
          items = items.filter(p => p.status !== 'paid')
        }
        setPayments(items)
        setCheckedIds(new Set()) // sekme değişince seçimi temizle
        setSummary({ total_pending: r.data.total_pending, overdue_count: r.data.overdue_count })
      })
  }

  const loadCal = () =>
    api.get('/payments/calendar', { params: { year: calYear, month: calMonth } })
      .then(r => setCalData(r.data.by_day || {}))

  useEffect(() => { loadList() }, [statusFilter, tab])
  useEffect(() => { loadCal() }, [calYear, calMonth])
  useEffect(() => { api.get('/orders', { params: { limit: 200 } }).then(r => setOrders(r.data.items)) }, [])

  // ---- item helpers ----
  const addItem    = () => setForm(f => ({ ...f, items: [...f.items, { product_name:'', quantity:1, unit:defaultUnit, unit_price:0 }] }))
  const removeItem = i  => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }))
  const updateItem = (i, key, val) => setForm(f => {
    const items = [...f.items]; items[i] = { ...items[i], [key]: val }; return { ...f, items }
  })
  const itemTotal  = item => (Number(item.quantity) || 0) * (Number(item.unit_price) || 0)
  const grandTotal = () => form.items.reduce((s, i) => s + itemTotal(i), 0)

  // ---- actions ----
  const handleManualSave = async () => {
    if (!form.customer_name) return toast.error('Müşteri adı zorunlu')
    if (!form.due_date)      return toast.error('Vade tarihi zorunlu')
    if (form.items.some(i => !i.product_name)) return toast.error('Tüm ürün adlarını doldurun')
    try {
      const total = grandTotal()
      await api.post('/payments', {
        order_id: form.order_id ? Number(form.order_id) : null,
        customer_name_override: form.customer_name,
        order_date: form.order_date || null,
        total_amount: total,
        due_date: form.due_date,
        items: form.items.map(i => ({ ...i, quantity: Number(i.quantity), unit_price: Number(i.unit_price) })),
        notes: form.notes,
      })
      toast.success('Vade kaydı oluşturuldu')
      setModal(null); setForm(emptyForm); loadList(); loadCal()
    } catch (e) { toast.error(e.response?.data?.detail || 'Hata') }
  }

  const handleMarkPaid = async () => {
    try {
      await api.put(`/payments/${selected.id}`, {
        paid_amount: (selected.paid_amount || 0) + Number(payForm.paid_amount),
        paid_date: payForm.paid_date
      })
      toast.success('Ödeme kaydedildi'); setModal(null); loadList(); loadCal()
    } catch (e) { toast.error(e.response?.data?.detail || 'Hata') }
  }

  const handleDelete = async id => {
    if (!confirm('Silmek istediğinize emin misiniz?')) return
    try { await api.delete(`/payments/${id}`); toast.success('Silindi'); loadList(); loadCal() }
    catch { toast.error('Hata') }
  }

  // Arşivden çıkar — ödemeyi sıfırla, pending'e döndür
  const handleUnarchive = async p => {
    if (!confirm('Bu ödemeyi arşivden çıkarmak ve ödenmemiş olarak işaretlemek istediğinize emin misiniz?')) return
    try {
      await api.put(`/payments/${p.id}`, { paid_amount: 0, paid_date: null })
      toast.success('Ödeme geri alındı, ödenmemiş olarak kaydedildi')
      loadList(); loadCal()
    } catch { toast.error('Hata') }
  }

  const exportExcel = async () => {
    try {
      const token = localStorage.getItem('token')
      const p = new URLSearchParams()
      if (statusFilter) p.append('status', statusFilter)
      const res = await fetch(`/api/payments/export?${p}`, { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = 'vade_takibi.xlsx'; a.click()
      URL.revokeObjectURL(url)
    } catch { toast.error('Export başarısız') }
  }

  const toggleCheck = (id) => setCheckedIds(prev => {
    const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next
  })
  const toggleAll = () => {
    if (checkedIds.size === payments.length) setCheckedIds(new Set())
    else setCheckedIds(new Set(payments.map(p => p.id)))
  }
  const openEdit = (p) => {
    setEditPayment(p)
    setEditForm({
      customer_name: p.customer_name,
      order_date: p.order_date || '',
      due_date: p.due_date || '',
      notes: p.notes || '',
      items: p.items?.length > 0 ? p.items.map(i => ({...i})) : [{ product_name:'', quantity:1, unit:defaultUnit, unit_price:0 }]
    })
  }

  const handleEditSave = async () => {
    if (!editForm.due_date) return toast.error('Vade tarihi zorunlu')
    try {
      const newTotal = editForm.items.reduce((s, i) => s + (Number(i.quantity)||0) * (Number(i.unit_price)||0), 0)
      const itemsJson = JSON.stringify(editForm.items.map(i => ({
        product_name: i.product_name || '',
        quantity: Number(i.quantity) || 0,
        unit: i.unit || 'adet',
        unit_price: Number(i.unit_price) || 0,
      })))
      await api.put(`/payments/${editPayment.id}`, {
        due_date: editForm.due_date,
        order_date: editForm.order_date || null,
        notes: editForm.notes || null,
        items_json: itemsJson,
        total_amount: newTotal > 0 ? newTotal : editPayment.total_amount,
      })
      toast.success('Güncellendi')
      setEditPayment(null); loadList(); loadCal()
    } catch (e) { toast.error(e.response?.data?.detail || 'Hata') }
  }

  const updateEditItem = (i, key, val) => {
    setEditForm(f => {
      const items = [...f.items]; items[i] = {...items[i], [key]: val}; return {...f, items}
    })
  }
  const addEditItem = () => setEditForm(f => ({...f, items: [...f.items, {product_name:'', quantity:1, unit:defaultUnit, unit_price:0}]}))
  const removeEditItem = (i) => setEditForm(f => ({...f, items: f.items.filter((_,idx) => idx !== i)}))

  const downloadSelectedPdf = async () => {
    if (checkedIds.size === 0) return toast.error('En az bir kayıt seçin')
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/payments/invoice-pdf', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify([...checkedIds])
      })
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `vade_fatura_${Date.now()}.pdf`; a.click()
      URL.revokeObjectURL(url)
      toast.success(`${checkedIds.size} kayıt PDF olarak indirildi`)
    } catch { toast.error('PDF oluşturulamadı') }
  }

  // ---- calendar ----
  const prevMonth = () => { if (calMonth === 1) { setCalYear(y => y-1); setCalMonth(12) } else setCalMonth(m => m-1) }
  const nextMonth = () => { if (calMonth === 12) { setCalYear(y => y+1); setCalMonth(1) } else setCalMonth(m => m+1) }
  const buildCalGrid = () => {
    const firstDay = new Date(calYear, calMonth-1, 1).getDay()
    const offset = firstDay === 0 ? 6 : firstDay - 1
    const daysInMonth = new Date(calYear, calMonth, 0).getDate()
    const cells = []
    for (let i = 0; i < offset; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(d)
    return cells
  }
  const calCells = buildCalGrid()

  return (
    <div>
      {/* Başlık */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Vade & Ödeme Takibi</h1>
        <div className="flex gap-2">
          {checkedIds.size > 0 && (
            <button onClick={downloadSelectedPdf}
              className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 text-sm">
              <FileText size={15} /> {checkedIds.size} Kayıt PDF
            </button>
          )}
          <button onClick={exportExcel}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm">
            <Download size={15} /> Excel İndir
          </button>
          <button onClick={() => { setForm({ order_id:'', customer_name:'', order_date:'', due_date:'', items:[{ product_name:'', quantity:1, unit:defaultUnit, unit_price:0 }], notes:'' }); setModal('manual') }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
            <Edit3 size={15} /> Manuel Giriş
          </button>
        </div>
      </div>

      {/* Aktif / Arşiv Sekmeleri */}
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1 w-fit">
        <button onClick={() => { setTab('active'); setStatusFilter('') }}
          className={`px-5 py-2 rounded-md text-sm font-medium transition-all ${tab === 'active' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
          Aktif
          {summary.overdue_count > 0 && tab !== 'archive' && (
            <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">{summary.overdue_count}</span>
          )}
        </button>
        <button onClick={() => { setTab('archive'); setStatusFilter('') }}
          className={`px-5 py-2 rounded-md text-sm font-medium transition-all ${tab === 'archive' ? 'bg-white shadow text-green-600' : 'text-gray-500 hover:text-gray-700'}`}>
          Ödenen Arşivi
        </button>
      </div>

      {/* Özet — sadece aktif sekmede */}
      {tab === 'active' && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <div className="p-2 bg-yellow-50 rounded-lg"><Clock size={20} className="text-yellow-600" /></div>
            <div>
              <p className="text-xs text-gray-500">
                {statusFilter === 'pending' ? 'Bekleyenlerin Toplamı'
                  : statusFilter === 'overdue' ? 'Gecikmiş Toplamı'
                  : statusFilter === 'partial' ? 'Kısmi Ödeme Toplamı'
                  : 'Bekleyen Alacak'}
              </p>
              <p className="text-xl font-bold">
                ₺{payments.reduce((s, p) => s + (p.remaining || 0), 0).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
              </p>
              {statusFilter && <p className="text-xs text-gray-400">{payments.length} kayıt</p>}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <div className="p-2 bg-red-50 rounded-lg"><AlertTriangle size={20} className="text-red-600" /></div>
            <div><p className="text-xs text-gray-500">Gecikmiş</p>
              <p className="text-xl font-bold text-red-600">{summary.overdue_count} adet</p>
              <p className="text-xs text-gray-400">
                ₺{payments.filter(p => p.status === 'overdue').reduce((s, p) => s + (p.remaining || 0), 0).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg"><CheckCircle size={20} className="text-green-600" /></div>
            <div><p className="text-xs text-gray-500">
              {statusFilter ? `Filtredeki Kayıt` : 'Toplam Kayıt'}
            </p>
              <p className="text-xl font-bold">{payments.length}</p>
              {!statusFilter && <p className="text-xs text-gray-400">
                Toplam: ₺{payments.reduce((s, p) => s + (p.total_amount || 0), 0).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
              </p>}
            </div>
          </div>
        </div>
      )}

      {/* Görünüm & Filtre */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex bg-white border rounded-lg overflow-hidden">
          <button onClick={() => setView('list')} className={`flex items-center gap-2 px-4 py-2 text-sm ${view==='list' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}><List size={15}/> Liste</button>
          <button onClick={() => setView('calendar')} className={`flex items-center gap-2 px-4 py-2 text-sm ${view==='calendar' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}><Calendar size={15}/> Takvim</button>
        </div>
        {view === 'list' && tab === 'active' && (
          <select className="border rounded-lg px-3 py-2 text-sm" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">Tüm Aktifler</option>
            <option value="pending">Bekliyor</option>
            <option value="overdue">Gecikmiş</option>
            <option value="partial">Kısmi Ödeme</option>
          </select>
        )}
      </div>

      {/* Liste */}
      {view === 'list' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-3 py-3 w-8">
                  <input type="checkbox" className="w-4 h-4 cursor-pointer accent-blue-600"
                    checked={payments.length > 0 && checkedIds.size === payments.length}
                    onChange={toggleAll} />
                </th>
                {['Müşteri','Sipariş Tarihi','Ürünler','Toplam','Ödenen','Kalan','Vade','Durum',''].map(h =>
                  <th key={h} className="px-3 py-3 text-left font-medium text-gray-600 text-xs">{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.length === 0 && <tr><td colSpan={10} className="px-4 py-10 text-center text-gray-400">{tab === 'archive' ? 'Henüz ödenen kayıt yok' : 'Kayıt bulunamadı'}</td></tr>}
              {payments.map(p => (
                <tr key={p.id} className={`hover:bg-gray-50 ${checkedIds.has(p.id) ? 'bg-blue-50' : ''} ${p.status==='overdue' ? 'bg-red-50' : ''} ${p.status==='paid' ? 'opacity-75' : ''}`}>
                  <td className="px-3 py-3">
                    <input type="checkbox" className="w-4 h-4 cursor-pointer accent-blue-600"
                      checked={checkedIds.has(p.id)} onChange={() => toggleCheck(p.id)} />
                  </td>
                  <td className="px-3 py-3 font-medium">{p.customer_name}</td>
                  <td className="px-3 py-3 text-gray-500">{p.order_date ? new Date(p.order_date).toLocaleDateString('tr-TR') : '-'}</td>
                  <td className="px-3 py-3 text-xs text-gray-600 max-w-[160px]">
                    {p.items?.length > 0
                      ? p.items.map(i => `${i.product_name} x${i.quantity}`).join(', ')
                      : <span className="text-gray-400">-</span>}
                  </td>
                  <td className="px-3 py-3">₺{p.total_amount?.toLocaleString('tr-TR',{maximumFractionDigits:2})}</td>
                  <td className="px-3 py-3 text-green-600">₺{p.paid_amount?.toLocaleString('tr-TR',{maximumFractionDigits:2})}</td>
                  <td className="px-3 py-3 font-medium">₺{p.remaining?.toLocaleString('tr-TR',{maximumFractionDigits:2})}</td>
                  <td className="px-3 py-3">
                    <span className={p.status==='overdue' ? 'text-red-600 font-medium' : ''}>
                      {new Date(p.due_date).toLocaleDateString('tr-TR')}
                    </span>
                    {p.overdue_days > 0 && <span className="text-xs text-red-400 block">{p.overdue_days} gün geçti</span>}
                  </td>
                  <td className="px-3 py-3"><Badge status={p.status} /></td>
                  <td className="px-3 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => setDetailPayment(p)}
                        className="text-blue-500 hover:text-blue-700 p-1" title="Detay"><Eye size={13}/></button>
                      <button onClick={() => openEdit(p)}
                        className="text-gray-500 hover:text-gray-700 p-1" title="Düzenle"><Edit2 size={13}/></button>
                      {p.status !== 'paid' && tab === 'active' && (
                        <button onClick={() => { setSelected(p); setPayForm({ paid_amount: p.remaining, paid_date: today.toISOString().split('T')[0] }); setModal('pay') }}
                          className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 whitespace-nowrap">Ödeme Al</button>
                      )}
                      {tab === 'archive' && (
                        <button onClick={() => handleUnarchive(p)}
                          className="text-xs bg-orange-500 text-white px-2 py-1 rounded hover:bg-orange-600 whitespace-nowrap flex items-center gap-1">
                          <ArchiveRestore size={11} /> Geri Al
                        </button>
                      )}
                      <button onClick={() => handleDelete(p.id)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={13}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Takvim */}
      {view === 'calendar' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded"><ChevronLeft size={20}/></button>
            <h2 className="font-semibold text-lg">{MONTHS[calMonth-1]} {calYear}</h2>
            <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded"><ChevronRight size={20}/></button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS.map(d => <div key={d} className="text-center text-xs font-medium text-gray-500 py-1">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calCells.map((day, i) => {
              if (!day) return <div key={i}/>
              const dp = calData[day] || []
              const isToday = day===today.getDate() && calMonth===today.getMonth()+1 && calYear===today.getFullYear()
              return (
                <div key={i} className={`min-h-16 p-1 rounded-lg border text-xs ${isToday ? 'border-blue-400 bg-blue-50' : 'border-gray-100'} ${dp.some(p=>p.status==='overdue') ? 'border-red-300' : ''}`}>
                  <div className={`font-medium mb-1 ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>{day}</div>
                  {dp.map(p => (
                    <div key={p.id} className={`rounded px-1 py-0.5 mb-0.5 truncate ${p.status==='overdue' ? 'bg-red-100 text-red-700' : p.status==='paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}
                      title={`${p.customer_name} - ₺${p.remaining}`}>
                      {p.customer_name} ₺{p.remaining?.toFixed(0)}
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Manuel Giriş Modalı */}
      {modal === 'manual' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold">Manuel Vade Girişi</h2>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
            </div>
            <div className="p-5 space-y-4">
              {/* Üst bilgiler */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Müşteri Adı *</label>
                  <input className="w-full border rounded-lg px-3 py-2 text-sm" value={form.customer_name}
                    onChange={e => setForm(f => ({...f, customer_name: e.target.value}))} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Sipariş / Gönderim Tarihi</label>
                  <input type="date" className="w-full border rounded-lg px-3 py-2 text-sm" value={form.order_date}
                    onChange={e => setForm(f => ({...f, order_date: e.target.value}))} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Vade Tarihi *</label>
                  <input type="date" className="w-full border rounded-lg px-3 py-2 text-sm" value={form.due_date}
                    onChange={e => setForm(f => ({...f, due_date: e.target.value}))} />
                  <div className="flex gap-2 mt-1">
                    {[15,30,45,60].map(d => (
                      <button key={d} type="button" onClick={() => {
                        const dt = new Date(); dt.setDate(dt.getDate()+d)
                        setForm(f => ({...f, due_date: dt.toISOString().split('T')[0]}))
                      }} className="text-xs text-blue-600 hover:underline">+{d}g</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Mevcut Sipariş (opsiyonel)</label>
                  <select className="w-full border rounded-lg px-3 py-2 text-sm" value={form.order_id}
                    onChange={e => setForm(f => ({...f, order_id: e.target.value}))}>
                    <option value="">-- Seçiniz --</option>
                    {orders.map(o => <option key={o.id} value={o.id}>#{o.id} - {o.customer_name}</option>)}
                  </select>
                </div>
              </div>

              {/* Ürün tablosu */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold">Ürünler</label>
                  <button onClick={addItem} className="flex items-center gap-1 text-xs text-blue-600 hover:underline"><Plus size={12}/> Satır Ekle</button>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-gray-600">Ürün Adı</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-600 w-20">Miktar</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-600 w-20">Birim</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-600 w-28">Birim Fiyat</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-600 w-28">Toplam</th>
                        <th className="w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {form.items.map((item, i) => (
                        <tr key={i}>
                          <td className="px-2 py-1.5">
                            <input className="w-full border rounded px-2 py-1 text-sm" value={item.product_name}
                              onChange={e => updateItem(i, 'product_name', e.target.value)} placeholder="Ürün adı" />
                          </td>
                          <td className="px-2 py-1.5">
                            <input type="number" className="w-full border rounded px-2 py-1 text-sm" value={item.quantity}
                              onChange={e => updateItem(i, 'quantity', e.target.value)} />
                          </td>
                          <td className="px-2 py-1.5">
                            <select className="w-full border rounded px-2 py-1 text-sm" value={item.unit}
                              onChange={e => updateItem(i, 'unit', e.target.value)}>
                              {unitList.map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                          </td>
                          <td className="px-2 py-1.5">
                            <input type="number" className="w-full border rounded px-2 py-1 text-sm" value={item.unit_price}
                              onChange={e => updateItem(i, 'unit_price', e.target.value)} />
                          </td>
                          <td className="px-2 py-1.5 font-medium text-gray-700">
                            ₺{itemTotal(item).toLocaleString('tr-TR', {maximumFractionDigits:2})}
                          </td>
                          <td className="px-2 py-1.5">
                            {form.items.length > 1 && (
                              <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600"><X size={14}/></button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50 border-t">
                        <td colSpan={4} className="px-3 py-2 text-right font-semibold text-sm">Genel Toplam:</td>
                        <td className="px-3 py-2 font-bold text-blue-600">₺{grandTotal().toLocaleString('tr-TR',{maximumFractionDigits:2})}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notlar</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm" value={form.notes}
                  onChange={e => setForm(f => ({...f, notes: e.target.value}))} />
              </div>
            </div>
            <div className="flex gap-2 p-4 border-t sticky bottom-0 bg-white">
              <button onClick={handleManualSave} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">Kaydet</button>
              <button onClick={() => setModal(null)} className="flex-1 border py-2 rounded-lg text-sm">İptal</button>
            </div>
          </div>
        </div>
      )}

      {/* Düzenleme Modalı */}
      {editPayment && editForm && editForm.items && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold">Vade Düzenle — {editPayment.customer_name}</h2>
              <button onClick={() => setEditPayment(null)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Müşteri Adı</label>
                  <input className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500" value={editForm.customer_name} disabled/>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Sipariş / Gönderim Tarihi</label>
                  <input type="date" className="w-full border rounded-lg px-3 py-2 text-sm" value={editForm.order_date}
                    onChange={e => setEditForm(f => ({...f, order_date: e.target.value}))}/>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Vade Tarihi *</label>
                  <input type="date" className="w-full border rounded-lg px-3 py-2 text-sm" value={editForm.due_date}
                    onChange={e => setEditForm(f => ({...f, due_date: e.target.value}))}/>
                  <div className="flex gap-2 mt-1">
                    {[15,30,45,60].map(d => (
                      <button key={d} type="button" onClick={() => {
                        const dt = new Date(); dt.setDate(dt.getDate()+d)
                        setEditForm(f => ({...f, due_date: dt.toISOString().split('T')[0]}))
                      }} className="text-xs text-blue-600 hover:underline">+{d}g</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Notlar</label>
                  <input className="w-full border rounded-lg px-3 py-2 text-sm" value={editForm.notes}
                    onChange={e => setEditForm(f => ({...f, notes: e.target.value}))}/>
                </div>
              </div>

              {/* Ürün tablosu */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold">Ürünler</label>
                  <button onClick={addEditItem} className="flex items-center gap-1 text-xs text-blue-600 hover:underline"><Plus size={12}/> Satır Ekle</button>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-gray-600">Ürün Adı</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-600 w-20">Miktar</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-600 w-20">Birim</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-600 w-28">Birim Fiyat</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-600 w-28">Toplam</th>
                        <th className="w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {editForm.items.map((item, i) => (
                        <tr key={i}>
                          <td className="px-2 py-1.5">
                            <input className="w-full border rounded px-2 py-1 text-sm" value={item.product_name}
                              onChange={e => updateEditItem(i, 'product_name', e.target.value)}/>
                          </td>
                          <td className="px-2 py-1.5">
                            <input type="number" className="w-full border rounded px-2 py-1 text-sm" value={item.quantity}
                              onChange={e => updateEditItem(i, 'quantity', e.target.value)}/>
                          </td>
                          <td className="px-2 py-1.5">
                            <select className="w-full border rounded px-2 py-1 text-sm" value={item.unit}
                              onChange={e => updateEditItem(i, 'unit', e.target.value)}>
                              {unitList.map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                          </td>
                          <td className="px-2 py-1.5">
                            <input type="number" className="w-full border rounded px-2 py-1 text-sm" value={item.unit_price}
                              onChange={e => updateEditItem(i, 'unit_price', e.target.value)}/>
                          </td>
                          <td className="px-2 py-1.5 font-medium text-gray-700">
                            ₺{((Number(item.quantity)||0)*(Number(item.unit_price)||0)).toLocaleString('tr-TR',{minimumFractionDigits:2})}
                          </td>
                          <td className="px-2 py-1.5">
                            {editForm.items.length > 1 && (
                              <button onClick={() => removeEditItem(i)} className="text-red-400 hover:text-red-600"><X size={14}/></button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50 border-t">
                        <td colSpan={4} className="px-3 py-2 text-right font-semibold text-sm">Genel Toplam:</td>
                        <td className="px-3 py-2 font-bold text-blue-600">
                          ₺{editForm.items.reduce((s,i) => s+(Number(i.quantity)||0)*(Number(i.unit_price)||0), 0).toLocaleString('tr-TR',{minimumFractionDigits:2})}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
            <div className="flex gap-2 p-4 border-t sticky bottom-0 bg-white">
              <button onClick={handleEditSave} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">Kaydet</button>
              <button onClick={() => setEditPayment(null)} className="flex-1 border py-2 rounded-lg text-sm">İptal</button>
            </div>
          </div>
        </div>
      )}

      {/* Detay Modalı */}
      {detailPayment && (
        <Modal title={`Vade Detayı — ${detailPayment.customer_name}`} onClose={() => setDetailPayment(null)}>
          <div className="space-y-4 text-sm">
            {/* Özet bilgiler */}
            <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-lg p-3">
              <div>
                <p className="text-xs text-gray-400">Müşteri</p>
                <p className="font-semibold">{detailPayment.customer_name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Durum</p>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS[detailPayment.status]?.cls}`}>
                  {STATUS[detailPayment.status]?.label}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-400">Sipariş / Gönderim Tarihi</p>
                <p className="font-medium">{detailPayment.order_date ? new Date(detailPayment.order_date).toLocaleDateString('tr-TR') : '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Vade Tarihi</p>
                <p className={`font-medium ${detailPayment.status === 'overdue' ? 'text-red-600' : ''}`}>
                  {new Date(detailPayment.due_date).toLocaleDateString('tr-TR')}
                  {detailPayment.overdue_days > 0 && <span className="text-xs text-red-400 ml-1">({detailPayment.overdue_days} gün geçti)</span>}
                </p>
              </div>
              {detailPayment.order_id && (
                <div>
                  <p className="text-xs text-gray-400">Bağlı Sipariş</p>
                  <p className="font-medium">#{detailPayment.order_id}</p>
                </div>
              )}
              {detailPayment.paid_date && (
                <div>
                  <p className="text-xs text-gray-400">Ödeme Tarihi</p>
                  <p className="font-medium text-green-600">{new Date(detailPayment.paid_date).toLocaleDateString('tr-TR')}</p>
                </div>
              )}
            </div>

            {/* Ürün tablosu */}
            {detailPayment.items?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">Ürünler</p>
                <table className="w-full text-sm border rounded-lg overflow-hidden">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">Ürün</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-600">Miktar</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-600">Birim</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-600">Birim Fiyat</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-600">Toplam</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {detailPayment.items.map((item, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2">{item.product_name}</td>
                        <td className="px-3 py-2 text-right">{item.quantity}</td>
                        <td className="px-3 py-2 text-right text-gray-500">{item.unit || 'adet'}</td>
                        <td className="px-3 py-2 text-right">₺{Number(item.unit_price).toLocaleString('tr-TR', {minimumFractionDigits:2})}</td>
                        <td className="px-3 py-2 text-right font-medium">₺{(item.quantity * item.unit_price).toLocaleString('tr-TR', {minimumFractionDigits:2})}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Finansal özet */}
            <div className="border rounded-lg overflow-hidden">
              {[
                ['Toplam Tutar', `₺${detailPayment.total_amount?.toLocaleString('tr-TR', {minimumFractionDigits:2})}`, ''],
                ['Ödenen', `₺${detailPayment.paid_amount?.toLocaleString('tr-TR', {minimumFractionDigits:2})}`, 'text-green-600'],
                ['Kalan', `₺${detailPayment.remaining?.toLocaleString('tr-TR', {minimumFractionDigits:2})}`, detailPayment.remaining > 0 ? 'text-red-600 font-bold' : 'text-green-600'],
              ].map(([label, value, cls]) => (
                <div key={label} className="flex justify-between px-4 py-2 border-b last:border-0 last:bg-gray-50">
                  <span className="text-gray-500">{label}</span>
                  <span className={cls}>{value}</span>
                </div>
              ))}
            </div>

            {detailPayment.notes && (
              <div className="bg-yellow-50 rounded-lg px-3 py-2 text-xs text-gray-600">
                <span className="font-medium">Not: </span>{detailPayment.notes}
              </div>
            )}
          </div>
          <div className="mt-4 flex gap-2">
            {detailPayment.status !== 'paid' && tab === 'active' && (
              <button onClick={() => { setSelected(detailPayment); setPayForm({ paid_amount: detailPayment.remaining, paid_date: today.toISOString().split('T')[0] }); setDetailPayment(null); setModal('pay') }}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 text-sm">Ödeme Al</button>
            )}
            <button onClick={() => setDetailPayment(null)} className="flex-1 border py-2 rounded-lg text-sm">Kapat</button>
          </div>
        </Modal>
      )}

      {/* Ödeme Al Modalı */}
      {modal === 'pay' && selected && (
        <Modal title={`Ödeme Al: ${selected.customer_name}`} onClose={() => setModal(null)}>
          <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm space-y-1">
            <p><span className="text-gray-500">Toplam:</span> ₺{selected.total_amount?.toFixed(2)}</p>
            <p><span className="text-gray-500">Daha önce ödenen:</span> ₺{selected.paid_amount?.toFixed(2)}</p>
            <p className="font-medium"><span className="text-gray-500">Kalan:</span> ₺{selected.remaining?.toFixed(2)}</p>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Alınan Ödeme (₺)</label>
              <input type="number" className="w-full border rounded-lg px-3 py-2 text-sm" value={payForm.paid_amount}
                onChange={e => setPayForm(f => ({...f, paid_amount: e.target.value}))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Ödeme Tarihi</label>
              <input type="date" className="w-full border rounded-lg px-3 py-2 text-sm" value={payForm.paid_date}
                onChange={e => setPayForm(f => ({...f, paid_date: e.target.value}))} />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleMarkPaid} className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 text-sm">Kaydet</button>
            <button onClick={() => setModal(null)} className="flex-1 border py-2 rounded-lg text-sm">İptal</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
