import { useEffect, useState } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'
import Table from '../components/Table'
import { Plus, Download, Trash2, Edit2, Eye, User, Search,
         Phone, Mail, Banknote, Calendar, CheckCircle, XCircle } from 'lucide-react'

const STATUS = {
  active:   { label: 'Aktif',  cls: 'bg-green-100 text-green-700' },
  inactive: { label: 'Pasif',  cls: 'bg-red-100 text-red-700' },
  on_leave: { label: 'İzinde', cls: 'bg-yellow-100 text-yellow-700' },
}
const LEAVE_TYPES = [
  { value: 'annual',  label: 'Yıllık İzin' },
  { value: 'sick',    label: 'Hastalık İzni' },
  { value: 'excuse',  label: 'Mazeret İzni' },
  { value: 'unpaid',  label: 'Ücretsiz İzin' },
  { value: 'other',   label: 'Diğer' },
]
const LEAVE_STATUS = {
  pending:  { label: 'Bekliyor',   cls: 'bg-yellow-100 text-yellow-700' },
  approved: { label: 'Onaylandı',  cls: 'bg-green-100 text-green-700' },
  rejected: { label: 'Reddedildi', cls: 'bg-red-100 text-red-700' },
}
const emptyForm = {
  first_name:'', last_name:'', tc_no:'', birth_date:'', gender:'',
  phone:'', email:'', address:'', emergency_contact:'', emergency_phone:'',
  department:'', position:'', hire_date:'', salary:'', iban:'', bank_name:'',
  annual_leave_days:14, notes:'', status:'active'
}
const today = new Date().toISOString().split('T')[0]

export default function Employees() {
  const [employees, setEmployees] = useState([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('active')
  const [departments, setDepartments] = useState([])
  const [modal, setModal] = useState(null) // null | 'form' | 'detail'
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [detail, setDetail] = useState(null)
  const [detailTab, setDetailTab] = useState('info')
  const [leaveForm, setLeaveForm] = useState({ leave_type:'annual', start_date:today, end_date:today, days:1, description:'' })
  const [salaryForm, setSalaryForm] = useState({ period:'', gross:'', deductions:'0', net:'', paid_date:today, notes:'' })

  const load = () =>
    api.get('/employees', { params: { search:search||undefined, department:deptFilter||undefined, status:statusFilter||undefined, limit:100 } })
      .then(r => { setEmployees(r.data.items); setTotal(r.data.total) })

  useEffect(() => { load() }, [search, deptFilter, statusFilter])
  useEffect(() => { api.get('/employees/departments').then(r => setDepartments(r.data)) }, [])

  const openCreate = () => { setForm(emptyForm); setEditId(null); setModal('form') }
  const openEdit = (e) => {
    setForm({
      first_name: e.first_name || '', last_name: e.last_name || '',
      tc_no: e.tc_no || '', birth_date: e.birth_date || '', gender: e.gender || '',
      phone: e.phone || '', email: e.email || '', address: e.address || '',
      emergency_contact: e.emergency_contact || '', emergency_phone: e.emergency_phone || '',
      department: e.department || '', position: e.position || '',
      hire_date: e.hire_date || '', salary: e.salary || '',
      iban: e.iban || '', bank_name: e.bank_name || '',
      annual_leave_days: e.annual_leave_days || 14,
      notes: e.notes || '', status: e.status || 'active'
    })
    setEditId(e.id); setModal('form')
  }

  const openDetail = async (e) => {
    try {
      const res = await api.get(`/employees/${e.id}`)
      setDetail(res.data); setDetailTab('info'); setModal('detail')
    } catch { toast.error('Hata') }
  }

  const handleSave = async () => {
    if (!form.first_name || !form.last_name) return toast.error('Ad ve soyad zorunlu')
    try {
      const payload = {
        ...form,
        salary: form.salary !== '' ? Number(form.salary) : 0,
        annual_leave_days: Number(form.annual_leave_days) || 14,
        birth_date: form.birth_date || null,
        hire_date: form.hire_date || null,
      }
      if (editId) {
        await api.put(`/employees/${editId}`, payload)
        toast.success('Güncellendi')
      } else {
        await api.post('/employees', payload)
        toast.success('Personel eklendi')
      }
      setModal(null); load()
      api.get('/employees/departments').then(r => setDepartments(r.data))
    } catch (e) { toast.error(e.response?.data?.detail || 'Hata') }
  }

  const handleDelete = async (id) => {
    if (!confirm('Personeli silmek istediginize emin misiniz?')) return
    try { await api.delete(`/employees/${id}`); toast.success('Silindi'); load() }
    catch { toast.error('Hata') }
  }

  const refreshDetail = async () => {
    if (!detail) return
    const res = await api.get(`/employees/${detail.id}`)
    setDetail(res.data)
  }

  const handleLeave = async () => {
    if (!leaveForm.start_date || !leaveForm.end_date) return toast.error('Tarih zorunlu')
    try {
      await api.post(`/employees/${detail.id}/leaves`, { ...leaveForm, days: Number(leaveForm.days) || 1 })
      toast.success('Izin kaydedildi')
      await refreshDetail()
      setLeaveForm({ leave_type:'annual', start_date:today, end_date:today, days:1, description:'' })
    } catch (e) { toast.error(e.response?.data?.detail || 'Hata') }
  }

  const approveLeave = async (leaveId, status) => {
    try {
      await api.put(`/employees/${detail.id}/leaves/${leaveId}`, { status })
      toast.success(status === 'approved' ? 'Onaylandi' : 'Reddedildi')
      await refreshDetail()
    } catch { toast.error('Hata') }
  }

  const deleteLeave = async (leaveId) => {
    try {
      await api.delete(`/employees/${detail.id}/leaves/${leaveId}`)
      toast.success('Silindi'); await refreshDetail()
    } catch { toast.error('Hata') }
  }

  const handleSalary = async () => {
    if (!salaryForm.period || !salaryForm.net) return toast.error('Donem ve net maas zorunlu')
    try {
      await api.post(`/employees/${detail.id}/salary`, {
        period: salaryForm.period,
        gross: Number(salaryForm.gross) || 0,
        deductions: Number(salaryForm.deductions) || 0,
        net: Number(salaryForm.net),
        paid_date: salaryForm.paid_date || null,
        notes: salaryForm.notes || null,
      })
      toast.success('Maas odendi, kasaya gider olarak eklendi')
      await refreshDetail()
      setSalaryForm({ period:'', gross:'', deductions:'0', net:'', paid_date:today, notes:'' })
    } catch (e) { toast.error(e.response?.data?.detail || 'Hata') }
  }

  const exportExcel = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/employees/export/list', { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = 'personel_listesi.xlsx'; a.click()
      URL.revokeObjectURL(url)
    } catch { toast.error('Export basarisiz') }
  }

  const totalSalary = employees.filter(e => e.status === 'active').reduce((s, e) => s + (e.salary || 0), 0)

  const columns = [
    { key: 'name', label: 'Ad Soyad', render: r => (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
          {(r.first_name||'?')[0]}{(r.last_name||'?')[0]}
        </div>
        <div>
          <div className="font-medium text-sm">{r.first_name} {r.last_name}</div>
          <div className="text-xs text-gray-400">{r.position || '-'}</div>
        </div>
      </div>
    )},
    { key: 'department', label: 'Departman', render: r => r.department || '-' },
    { key: 'phone', label: 'Telefon', render: r => r.phone || '-' },
    { key: 'salary', label: 'Maas', render: r => r.salary ? `${r.salary.toLocaleString('tr-TR')} TL` : '-' },
    { key: 'leave', label: 'Izin', render: r => (
      <span className="text-xs">{r.remaining_leave}/{r.annual_leave_days} gun</span>
    )},
    { key: 'status', label: 'Durum', render: r => {
      const s = STATUS[r.status] || STATUS.active
      return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>{s.label}</span>
    }},
    { key: 'actions', label: '', render: r => (
      <div className="flex gap-1">
        <button onClick={() => openDetail(r)} className="text-blue-500 hover:text-blue-700 p-1"><Eye size={14}/></button>
        <button onClick={() => openEdit(r)} className="text-gray-500 hover:text-gray-700 p-1"><Edit2 size={14}/></button>
        <button onClick={() => handleDelete(r.id)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={14}/></button>
      </div>
    )}
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Personel Yonetimi</h1>
        <div className="flex gap-2">
          <button onClick={exportExcel} className="flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 text-sm">
            <Download size={15}/> Excel
          </button>
          <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
            <Plus size={16}/> Yeni Personel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg"><User size={20} className="text-blue-600"/></div>
          <div><p className="text-xs text-gray-500">Toplam Personel</p><p className="text-xl font-bold">{total}</p></div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="p-2 bg-green-50 rounded-lg"><CheckCircle size={20} className="text-green-600"/></div>
          <div><p className="text-xs text-gray-500">Aktif</p><p className="text-xl font-bold text-green-600">{employees.filter(e=>e.status==='active').length}</p></div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="p-2 bg-orange-50 rounded-lg"><Banknote size={20} className="text-orange-600"/></div>
          <div><p className="text-xs text-gray-500">Toplam Maas</p><p className="text-xl font-bold">{totalSalary.toLocaleString('tr-TR')} TL</p></div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4 flex flex-wrap gap-3">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-2.5 text-gray-400"/>
          <input placeholder="Ad, departman, telefon..." className="pl-8 border rounded-lg px-3 py-2 text-sm w-56"
            value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
        <select className="border rounded-lg px-3 py-2 text-sm" value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
          <option value="">Tum Departmanlar</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select className="border rounded-lg px-3 py-2 text-sm" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">Tum Durumlar</option>
          <option value="active">Aktif</option>
          <option value="inactive">Pasif</option>
          <option value="on_leave">Izinde</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <Table columns={columns} data={employees} emptyText="Personel bulunamadi"/>
      </div>

      {/* Personel Form Modali */}
      {modal === 'form' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold">{editId ? 'Personel Duzenle' : 'Yeni Personel'}</h2>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600 text-xl">x</button>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['first_name','Ad *','text'],['last_name','Soyad *','text'],
                  ['tc_no','TC Kimlik No','text'],['birth_date','Dogum Tarihi','date'],
                  ['phone','Telefon','text'],['email','E-posta','email'],
                  ['department','Departman','text'],['position','Pozisyon / Unvan','text'],
                  ['hire_date','Ise Giris Tarihi','date'],['salary','Brut Maas (TL)','number'],
                  ['iban','IBAN','text'],['bank_name','Banka Adi','text'],
                  ['emergency_contact','Acil Iletisim Kisisi','text'],['emergency_phone','Acil Telefon','text'],
                  ['annual_leave_days','Yillik Izin Hakki (gun)','number'],
                ].map(([k,l,t]) => (
                  <div key={k}>
                    <label className="block text-xs font-medium mb-1 text-gray-600">{l}</label>
                    <input type={t} className="w-full border rounded-lg px-3 py-2 text-sm"
                      value={form[k]} onChange={e => setForm(f => ({...f, [k]: e.target.value}))}/>
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-medium mb-1 text-gray-600">Cinsiyet</label>
                  <select className="w-full border rounded-lg px-3 py-2 text-sm" value={form.gender} onChange={e => setForm(f => ({...f, gender: e.target.value}))}>
                    <option value="">Seciniz</option>
                    <option value="M">Erkek</option>
                    <option value="F">Kadin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 text-gray-600">Durum</label>
                  <select className="w-full border rounded-lg px-3 py-2 text-sm" value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))}>
                    <option value="active">Aktif</option>
                    <option value="inactive">Pasif</option>
                    <option value="on_leave">Izinde</option>
                  </select>
                </div>
              </div>
              <div className="mt-3">
                <label className="block text-xs font-medium mb-1 text-gray-600">Adres</label>
                <textarea rows={2} className="w-full border rounded-lg px-3 py-2 text-sm" value={form.address} onChange={e => setForm(f => ({...f, address: e.target.value}))}/>
              </div>
              <div className="mt-3">
                <label className="block text-xs font-medium mb-1 text-gray-600">Notlar</label>
                <textarea rows={2} className="w-full border rounded-lg px-3 py-2 text-sm" value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))}/>
              </div>
            </div>
            <div className="flex gap-2 p-4 border-t sticky bottom-0 bg-white">
              <button onClick={handleSave} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">Kaydet</button>
              <button onClick={() => setModal(null)} className="flex-1 border py-2 rounded-lg text-sm">Iptal</button>
            </div>
          </div>
        </div>
      )}

      {/* Detay Modali */}
      {modal === 'detail' && detail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                  {(detail.first_name||'?')[0]}{(detail.last_name||'?')[0]}
                </div>
                <div>
                  <h2 className="text-lg font-semibold">{detail.first_name} {detail.last_name}</h2>
                  <p className="text-xs text-gray-500">{detail.position || '-'} - {detail.department || '-'}</p>
                </div>
              </div>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600 text-xl">x</button>
            </div>

            <div className="flex gap-1 px-4 pt-3 border-b">
              {[['info','Bilgiler'],['leaves','Izinler'],['salary','Maas']].map(([k,l]) => (
                <button key={k} onClick={() => setDetailTab(k)}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${detailTab===k ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-700'}`}>{l}</button>
              ))}
            </div>

            <div className="overflow-y-auto flex-1 p-5">
              {detailTab === 'info' && (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {[
                    ['Telefon', detail.phone],['E-posta', detail.email],
                    ['TC No', detail.tc_no],['Dogum Tarihi', detail.birth_date],
                    ['Ise Giris', detail.hire_date],['Departman', detail.department],
                    ['Pozisyon', detail.position],['Durum', STATUS[detail.status]?.label],
                    ['Brut Maas', detail.salary ? `${detail.salary.toLocaleString('tr-TR')} TL` : '-'],
                    ['IBAN', detail.iban],['Banka', detail.bank_name],
                    ['Acil Kisi', detail.emergency_contact],['Acil Tel', detail.emergency_phone],
                    ['Yillik Izin', `${detail.remaining_leave}/${detail.annual_leave_days} gun kaldi`],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p className="text-xs text-gray-400">{label}</p>
                      <p className="font-medium">{value || '-'}</p>
                    </div>
                  ))}
                  {detail.address && (
                    <div className="col-span-2">
                      <p className="text-xs text-gray-400">Adres</p>
                      <p className="font-medium">{detail.address}</p>
                    </div>
                  )}
                </div>
              )}

              {detailTab === 'leaves' && (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-xl p-4 border">
                    <h3 className="font-semibold text-sm mb-3">Yeni Izin Talebi</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium mb-1">Izin Turu</label>
                        <select className="w-full border rounded-lg px-3 py-2 text-sm" value={leaveForm.leave_type} onChange={e => setLeaveForm(f => ({...f, leave_type: e.target.value}))}>
                          {LEAVE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Gun Sayisi</label>
                        <input type="number" min="1" className="w-full border rounded-lg px-3 py-2 text-sm" value={leaveForm.days} onChange={e => setLeaveForm(f => ({...f, days: e.target.value}))}/>
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Baslangic</label>
                        <input type="date" className="w-full border rounded-lg px-3 py-2 text-sm" value={leaveForm.start_date} onChange={e => setLeaveForm(f => ({...f, start_date: e.target.value}))}/>
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Bitis</label>
                        <input type="date" className="w-full border rounded-lg px-3 py-2 text-sm" value={leaveForm.end_date} onChange={e => setLeaveForm(f => ({...f, end_date: e.target.value}))}/>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-medium mb-1">Aciklama</label>
                        <input className="w-full border rounded-lg px-3 py-2 text-sm" value={leaveForm.description} onChange={e => setLeaveForm(f => ({...f, description: e.target.value}))}/>
                      </div>
                    </div>
                    <button onClick={handleLeave} className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">Izin Ekle</button>
                  </div>
                  <div className="space-y-2">
                    {(detail.leaves || []).length === 0 && <p className="text-gray-400 text-sm text-center py-4">Izin kaydi yok</p>}
                    {(detail.leaves || []).map(l => (
                      <div key={l.id} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                        <div>
                          <span className="font-medium text-sm">{l.leave_type_label}</span>
                          <span className="text-xs text-gray-500 ml-2">{l.start_date} - {l.end_date} ({l.days} gun)</span>
                          {l.description && <span className="text-xs text-gray-400 ml-2 italic">{l.description}</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${LEAVE_STATUS[l.status]?.cls}`}>{LEAVE_STATUS[l.status]?.label}</span>
                          {l.status === 'pending' && (
                            <>
                              <button onClick={() => approveLeave(l.id, 'approved')} className="text-green-600 hover:text-green-800 p-1"><CheckCircle size={14}/></button>
                              <button onClick={() => approveLeave(l.id, 'rejected')} className="text-red-500 hover:text-red-700 p-1"><XCircle size={14}/></button>
                            </>
                          )}
                          <button onClick={() => deleteLeave(l.id)} className="text-red-400 hover:text-red-600 p-1 text-xs">sil</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {detailTab === 'salary' && (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-xl p-4 border">
                    <h3 className="font-semibold text-sm mb-3">Maas Odemesi Yap</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium mb-1">Donem (YYYY-AA)</label>
                        <input placeholder="2024-04" className="w-full border rounded-lg px-3 py-2 text-sm" value={salaryForm.period} onChange={e => setSalaryForm(f => ({...f, period: e.target.value}))}/>
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Odeme Tarihi</label>
                        <input type="date" className="w-full border rounded-lg px-3 py-2 text-sm" value={salaryForm.paid_date} onChange={e => setSalaryForm(f => ({...f, paid_date: e.target.value}))}/>
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Brut (TL)</label>
                        <input type="number" className="w-full border rounded-lg px-3 py-2 text-sm" placeholder={String(detail.salary || '')} value={salaryForm.gross} onChange={e => setSalaryForm(f => ({...f, gross: e.target.value}))}/>
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Kesintiler (TL)</label>
                        <input type="number" className="w-full border rounded-lg px-3 py-2 text-sm" value={salaryForm.deductions} onChange={e => setSalaryForm(f => ({...f, deductions: e.target.value}))}/>
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Net Odenen (TL) *</label>
                        <input type="number" className="w-full border rounded-lg px-3 py-2 text-sm" value={salaryForm.net} onChange={e => setSalaryForm(f => ({...f, net: e.target.value}))}/>
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Notlar</label>
                        <input className="w-full border rounded-lg px-3 py-2 text-sm" value={salaryForm.notes} onChange={e => setSalaryForm(f => ({...f, notes: e.target.value}))}/>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Net tutar otomatik olarak kasaya gider olarak kaydedilir.</p>
                    <button onClick={handleSalary} className="mt-3 bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700">Odemeyi Kaydet</button>
                  </div>
                  <div className="space-y-2">
                    {(detail.salary_payments || []).length === 0 && <p className="text-gray-400 text-sm text-center py-4">Maas odeme kaydi yok</p>}
                    {(detail.salary_payments || []).map(s => (
                      <div key={s.id} className="flex items-center justify-between p-3 bg-white border rounded-lg text-sm">
                        <div>
                          <span className="font-medium">{s.period}</span>
                          <span className="text-gray-500 ml-3">Brut: {(s.gross||0).toLocaleString('tr-TR')} TL</span>
                          <span className="text-gray-500 ml-2">Kesinti: {(s.deductions||0).toLocaleString('tr-TR')} TL</span>
                          <span className="text-green-600 font-medium ml-2">Net: {(s.net||0).toLocaleString('tr-TR')} TL</span>
                        </div>
                        <span className="text-xs text-gray-400">{s.paid_date || '-'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
