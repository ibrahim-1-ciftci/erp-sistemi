import { useEffect, useState } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { useAuth } from '../store/authStore'
import Modal from '../components/Modal'
import { Save, KeyRound, Building2, Receipt, Users, Plus, Edit2, Trash2, ShieldCheck, ShieldOff } from 'lucide-react'

export default function Settings() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const [company, setCompany] = useState({ company_name: '', company_sub: '', kdv_rate: 20 })
  const [pw, setPw] = useState({ current_password: '', new_password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)
  const [users, setUsers] = useState([])
  const [userModal, setUserModal] = useState(null) // null | 'create' | 'edit'
  const [editUser, setEditUser] = useState(null)
  const [userForm, setUserForm] = useState({ username: '', email: '', password: '', role: 'user' })

  useEffect(() => {
    api.get('/settings').then(r => {
      setCompany({ company_name: r.data.company_name, company_sub: r.data.company_sub, kdv_rate: r.data.kdv_rate })
    })
    if (isAdmin) api.get('/settings/users').then(r => setUsers(r.data))
  }, [])

  const loadUsers = () => api.get('/settings/users').then(r => setUsers(r.data))

  const handleUserSave = async () => {
    if (!userForm.username || !userForm.email) return toast.error('Kullanıcı adı ve e-posta zorunlu')
    try {
      if (userModal === 'create') {
        if (!userForm.password) return toast.error('Şifre zorunlu')
        await api.post('/settings/users', userForm)
        toast.success('Kullanıcı oluşturuldu')
      } else {
        await api.put(`/settings/users/${editUser.id}`, {
          email: userForm.email, role: userForm.role,
          ...(userForm.password ? { password: userForm.password } : {})
        })
        toast.success('Güncellendi')
      }
      setUserModal(null); loadUsers()
    } catch (e) { toast.error(e.response?.data?.detail || 'Hata') }
  }

  const toggleActive = async (u) => {
    try {
      await api.put(`/settings/users/${u.id}`, { is_active: !u.is_active })
      toast.success(u.is_active ? 'Devre dışı bırakıldı' : 'Aktif edildi')
      loadUsers()
    } catch (e) { toast.error('Hata') }
  }

  const deleteUser = async (id) => {
    if (!confirm('Kullanıcıyı silmek istediğinize emin misiniz?')) return
    try { await api.delete(`/settings/users/${id}`); toast.success('Silindi'); loadUsers() }
    catch (e) { toast.error(e.response?.data?.detail || 'Hata') }
  }

  const saveCompany = async () => {
    setLoading(true)
    try {
      await api.put('/settings', company)
      toast.success('Ayarlar kaydedildi')
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Hata')
    } finally { setLoading(false) }
  }

  const savePassword = async () => {
    if (pw.new_password !== pw.confirm) return toast.error('Yeni şifreler eşleşmiyor')
    if (pw.new_password.length < 6) return toast.error('En az 6 karakter olmalı')
    setPwLoading(true)
    try {
      await api.post('/settings/change-password', {
        current_password: pw.current_password,
        new_password: pw.new_password,
      })
      toast.success('Şifre değiştirildi')
      setPw({ current_password: '', new_password: '', confirm: '' })
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Hata')
    } finally { setPwLoading(false) }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Ayarlar</h1>

      {/* Hesap Bilgileri */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-blue-50 rounded-lg"><Building2 size={18} className="text-blue-600" /></div>
          <h2 className="font-semibold">Hesap Bilgileri</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-gray-500">Kullanıcı Adı:</span> <span className="font-medium ml-1">{user?.username}</span></div>
          <div><span className="text-gray-500">Rol:</span> <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-medium ${user?.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>{user?.role}</span></div>
          <div><span className="text-gray-500">E-posta:</span> <span className="font-medium ml-1">{user?.email}</span></div>
        </div>
      </div>

      {/* Şirket & KDV Ayarları — sadece admin */}
      {isAdmin && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-green-50 rounded-lg"><Receipt size={18} className="text-green-600" /></div>
            <h2 className="font-semibold">Şirket & Fatura Ayarları</h2>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Şirket Adı</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm"
                value={company.company_name}
                onChange={e => setCompany(c => ({ ...c, company_name: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Alt Başlık</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm"
                value={company.company_sub}
                onChange={e => setCompany(c => ({ ...c, company_sub: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">KDV Oranı (%)</label>
              <div className="flex items-center gap-3">
                <input type="number" min="0" max="100" className="w-28 border rounded-lg px-3 py-2 text-sm"
                  value={company.kdv_rate}
                  onChange={e => setCompany(c => ({ ...c, kdv_rate: Number(e.target.value) }))} />
                <div className="flex gap-2">
                  {[0, 1, 8, 10, 18, 20].map(r => (
                    <button key={r} type="button"
                      onClick={() => setCompany(c => ({ ...c, kdv_rate: r }))}
                      className={`text-xs px-2 py-1 rounded border ${company.kdv_rate === r ? 'bg-blue-600 text-white border-blue-600' : 'text-blue-600 border-blue-200 hover:bg-blue-50'}`}>
                      %{r}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-1">0 girilirse faturada KDV satırı gösterilmez</p>
            </div>
          </div>
          <button onClick={saveCompany} disabled={loading}
            className="mt-4 flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm disabled:opacity-50">
            <Save size={15} /> {loading ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      )}

      {/* Şifre Değiştir */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-orange-50 rounded-lg"><KeyRound size={18} className="text-orange-600" /></div>
          <h2 className="font-semibold">Şifre Değiştir</h2>
        </div>
        <div className="space-y-3">
          {[['current_password','Mevcut Şifre'],['new_password','Yeni Şifre'],['confirm','Yeni Şifre (Tekrar)']].map(([k,l]) => (
            <div key={k}>
              <label className="block text-sm font-medium mb-1">{l}</label>
              <input type="password" className="w-full border rounded-lg px-3 py-2 text-sm"
                value={pw[k]} onChange={e => setPw(p => ({ ...p, [k]: e.target.value }))} />
            </div>
          ))}
        </div>
        <button onClick={savePassword} disabled={pwLoading}
          className="mt-4 flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 text-sm disabled:opacity-50">
          <KeyRound size={15} /> {pwLoading ? 'Kaydediliyor...' : 'Şifreyi Değiştir'}
        </button>
      </div>

      {/* Kullanıcı Yönetimi — sadece admin */}
      {isAdmin && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-50 rounded-lg"><Users size={18} className="text-purple-600" /></div>
              <h2 className="font-semibold">Kullanıcı Yönetimi</h2>
            </div>
            <button onClick={() => { setUserForm({ username: '', email: '', password: '', role: 'user' }); setUserModal('create') }}
              className="flex items-center gap-2 bg-purple-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-purple-700">
              <Plus size={14} /> Yeni Kullanıcı
            </button>
          </div>
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['Kullanıcı Adı','E-posta','Rol','Durum',''].map(h =>
                    <th key={h} className="px-4 py-2 text-left font-medium text-gray-600">{h}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map(u => (
                  <tr key={u.id} className={`hover:bg-gray-50 ${!u.is_active ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-2 font-medium">{u.username}</td>
                    <td className="px-4 py-2 text-gray-500">{u.email}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                        {u.role === 'admin' ? 'Admin' : 'Kullanıcı'}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {u.is_active ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex gap-1">
                        <button onClick={() => { setEditUser(u); setUserForm({ username: u.username, email: u.email, password: '', role: u.role }); setUserModal('edit') }}
                          className="text-blue-500 hover:text-blue-700 p-1"><Edit2 size={13} /></button>
                        <button onClick={() => toggleActive(u)} title={u.is_active ? 'Devre dışı bırak' : 'Aktif et'}
                          className="text-gray-500 hover:text-gray-700 p-1">
                          {u.is_active ? <ShieldOff size={13} /> : <ShieldCheck size={13} />}
                        </button>
                        <button onClick={() => deleteUser(u.id)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Kullanıcı Modalı */}
      {userModal && (
        <Modal title={userModal === 'create' ? 'Yeni Kullanıcı' : `Düzenle: ${editUser?.username}`} onClose={() => setUserModal(null)}>
          <div className="space-y-3">
            {userModal === 'create' && (
              <div>
                <label className="block text-sm font-medium mb-1">Kullanıcı Adı *</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm" value={userForm.username}
                  onChange={e => setUserForm(f => ({ ...f, username: e.target.value }))} />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1">E-posta *</label>
              <input type="email" className="w-full border rounded-lg px-3 py-2 text-sm" value={userForm.email}
                onChange={e => setUserForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{userModal === 'edit' ? 'Yeni Şifre (boş bırakılırsa değişmez)' : 'Şifre *'}</label>
              <input type="password" className="w-full border rounded-lg px-3 py-2 text-sm" value={userForm.password}
                onChange={e => setUserForm(f => ({ ...f, password: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Rol</label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm" value={userForm.role}
                onChange={e => setUserForm(f => ({ ...f, role: e.target.value }))}>
                <option value="user">Kullanıcı</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleUserSave} className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 text-sm">Kaydet</button>
            <button onClick={() => setUserModal(null)} className="flex-1 border py-2 rounded-lg text-sm">İptal</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
