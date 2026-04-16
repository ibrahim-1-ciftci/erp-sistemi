import { useEffect, useState } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { useAuth } from '../store/authStore'
import { useTheme, THEMES } from '../store/themeStore'
import Modal from '../components/Modal'
import { Save, KeyRound, Building2, Receipt, Users, Plus, Edit2, Trash2, ShieldCheck, ShieldOff, ShieldAlert, Palette, Shield } from 'lucide-react'

const MODULE_LABELS = { raw_materials:'Hammaddeler', products:'Urunler', bom:'Receteler', production:'Uretim', orders:'Siparisler', customers:'Musteriler', payments:'Vade Takibi', debts:'Borc Takibi', cashflow:'Kasa/Ciro', purchases:'Satin Alma', suppliers:'Tedarikciler', reports:'Raporlar', settings:'Ayarlar' }
const ACTION_LABELS = { view:'Goruntule', create:'Ekle', edit:'Duzenle', delete:'Sil' }
const ACTIONS = ['view','create','edit','delete']
const SYSTEM_ROLES = [{ name:'user', label:'Kullanici (user)' }]

export default function Settings() {
  const { user, updatePermissions } = useAuth()
  const { theme, setTheme } = useTheme()
  const isAdmin = user?.role === 'admin'

  const [company, setCompany] = useState({ company_name:'', company_sub:'', kdv_rate:20, default_unit:'kg', weight_units:'kg,g,ton,lt,ml,adet,kutu,paket,metre,cm' })
  const [pw, setPw] = useState({ current_password:'', new_password:'', confirm:'' })
  const [loading, setLoading] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)
  const [users, setUsers] = useState([])
  const [userModal, setUserModal] = useState(null)
  const [editUser, setEditUser] = useState(null)
  const [userForm, setUserForm] = useState({ username:'', email:'', password:'', role:'user' })
  const [customRoles, setCustomRoles] = useState([])
  const [roleModal, setRoleModal] = useState(false)
  const [roleForm, setRoleForm] = useState({ name:'', label:'' })
  const [permTab, setPermTab] = useState('user')
  const [permData, setPermData] = useState({})
  const [permModules, setPermModules] = useState([])
  const [permDirty, setPermDirty] = useState(false)

  const allRoles = [...SYSTEM_ROLES, ...customRoles]

  useEffect(() => {
    api.get('/settings').then(r => setCompany({ company_name:r.data.company_name, company_sub:r.data.company_sub, kdv_rate:r.data.kdv_rate, default_unit:r.data.default_unit||'kg', weight_units:r.data.weight_units||'kg,g,ton,lt,ml,adet,kutu,paket,metre,cm' }))
    if (isAdmin) { loadUsers(); loadCustomRoles(); loadPerms('user') }
  }, [])

  const loadUsers = () => api.get('/settings/users').then(r => setUsers(r.data))
  const loadCustomRoles = () => api.get('/settings/roles').then(r => setCustomRoles(r.data)).catch(() => {})
  const loadPerms = (role) => api.get(`/settings/permissions/${role}`).then(r => { setPermData(r.data.permissions); setPermModules(r.data.modules); setPermDirty(false) }).catch(() => {})
  const handlePermTabChange = (role) => { setPermTab(role); loadPerms(role) }

  const togglePerm = (module, action) => {
    setPermData(prev => ({ ...prev, [module]: { ...prev[module], [action]: !prev[module]?.[action] } }))
    setPermDirty(true)
  }
  const toggleRow = (module) => {
    const allOn = ACTIONS.every(a => permData[module]?.[a])
    setPermData(prev => ({ ...prev, [module]: Object.fromEntries(ACTIONS.map(a => [a, !allOn])) }))
    setPermDirty(true)
  }
  const savePerms = async () => {
    try {
      const updates = permModules.map(m => ({ module:m, can_view:permData[m]?.view??false, can_create:permData[m]?.create??false, can_edit:permData[m]?.edit??false, can_delete:permData[m]?.delete??false }))
      await api.put(`/settings/permissions/${permTab}`, updates)
      toast.success('Yetkiler kaydedildi'); setPermDirty(false)
      if (user?.role === permTab) { const r = await api.get('/settings'); updatePermissions(r.data.user?.permissions||{}) }
    } catch (e) { toast.error(e.response?.data?.detail||'Hata') }
  }
  const handleCreateRole = async () => {
    if (!roleForm.name || !roleForm.label) return toast.error('Rol adi ve etiket zorunlu')
    try { await api.post('/settings/roles', roleForm); toast.success('Rol olusturuldu'); setRoleModal(false); setRoleForm({name:'',label:''}); loadCustomRoles() }
    catch (e) { toast.error(e.response?.data?.detail||'Hata') }
  }
  const handleDeleteRole = async (name) => {
    if (!confirm(`"${name}" rolunu silmek istediginize emin misiniz?`)) return
    try { await api.delete(`/settings/roles/${name}`); toast.success('Rol silindi'); loadCustomRoles(); loadUsers(); if (permTab===name) { setPermTab('user'); loadPerms('user') } }
    catch (e) { toast.error(e.response?.data?.detail||'Hata') }
  }
  const handleUserSave = async () => {
    if (!userForm.username||!userForm.email) return toast.error('Kullanici adi ve e-posta zorunlu')
    try {
      if (userModal==='create') { if (!userForm.password) return toast.error('Sifre zorunlu'); await api.post('/settings/users', userForm); toast.success('Kullanici olusturuldu') }
      else { await api.put(`/settings/users/${editUser.id}`, { email:userForm.email, role:userForm.role, ...(userForm.password?{password:userForm.password}:{}) }); toast.success('Guncellendi') }
      setUserModal(null); loadUsers()
    } catch (e) { toast.error(e.response?.data?.detail||'Hata') }
  }
  const toggleActive = async (u) => {
    try { await api.put(`/settings/users/${u.id}`,{is_active:!u.is_active}); toast.success(u.is_active?'Devre disi':'Aktif edildi'); loadUsers() } catch { toast.error('Hata') }
  }
  const deleteUser = async (id) => {
    if (!confirm('Silmek istediginize emin misiniz?')) return
    try { await api.delete(`/settings/users/${id}`); toast.success('Silindi'); loadUsers() } catch (e) { toast.error(e.response?.data?.detail||'Hata') }
  }
  const saveCompany = async () => {
    setLoading(true)
    try { await api.put('/settings', company); toast.success('Kaydedildi') } catch (e) { toast.error(e.response?.data?.detail||'Hata') } finally { setLoading(false) }
  }
  const savePassword = async () => {
    if (pw.new_password!==pw.confirm) return toast.error('Sifreler eslesmiyor')
    if (pw.new_password.length<6) return toast.error('En az 6 karakter')
    setPwLoading(true)
    try { await api.post('/settings/change-password',{current_password:pw.current_password,new_password:pw.new_password}); toast.success('Sifre degistirildi'); setPw({current_password:'',new_password:'',confirm:''}) }
    catch (e) { toast.error(e.response?.data?.detail||'Hata') } finally { setPwLoading(false) }
  }
  const roleBadge = (role) => {
    const found = allRoles.find(r => r.name === role)
    const label = found?.label || (role === 'admin' ? 'Admin' : role)
    const cls = role==='admin' ? 'bg-purple-100 text-purple-700' : role==='user' ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-700'
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{label}</span>
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold" style={{color:'var(--text-primary)'}}>Ayarlar</h1>

      <div className="rounded-xl shadow-sm border p-5" style={{backgroundColor:'var(--bg-card)',borderColor:'var(--border)'}}>
        <div className="flex items-center gap-2 mb-5">
          <div className="p-2 rounded-lg" style={{backgroundColor:'rgba(139,92,246,0.15)'}}><Palette size={18} style={{color:'var(--accent)'}} /></div>
          <h2 className="font-semibold" style={{color:'var(--text-primary)'}}>Tema</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Object.entries(THEMES).map(([key, t]) => (
            <button key={key} onClick={() => setTheme(key)} className="relative rounded-xl p-4 border-2 transition-all text-left"
              style={{ borderColor: theme===key ? 'var(--accent)' : t.vars['--border'], backgroundColor: t.vars['--bg-card'], transform: theme===key ? 'scale(1.03)' : 'scale(1)' }}>
              <div className="flex gap-1.5 mb-3">
                <div className="flex-1 h-3 rounded-full" style={{backgroundColor:t.vars['--bg-sidebar']}} />
                <div className="flex-1 h-3 rounded-full" style={{backgroundColor:t.vars['--accent']}} />
                <div className="flex-1 h-3 rounded-full" style={{backgroundColor:t.vars['--bg-app']}} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold" style={{color:t.vars['--text-primary']}}>{t.name}</span>
                {theme===key && <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{backgroundColor:t.vars['--accent'],color:t.vars['--accent-text']}}>aktif</span>}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl shadow-sm border p-5" style={{backgroundColor:'var(--bg-card)',borderColor:'var(--border)'}}>
        <div className="flex items-center gap-2 mb-4"><div className="p-2 bg-blue-50 rounded-lg"><Building2 size={18} className="text-blue-600" /></div><h2 className="font-semibold" style={{color:'var(--text-primary)'}}>Hesap Bilgileri</h2></div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span style={{color:'var(--text-secondary)'}}>Kullanici:</span> <span className="font-medium ml-1" style={{color:'var(--text-primary)'}}>{user?.username}</span></div>
          <div className="flex items-center gap-1"><span style={{color:'var(--text-secondary)'}}>Rol:</span> <span className="ml-1">{roleBadge(user?.role)}</span></div>
        </div>
      </div>

      {isAdmin && (
        <div className="rounded-xl shadow-sm border p-5" style={{backgroundColor:'var(--bg-card)',borderColor:'var(--border)'}}>
          <div className="flex items-center gap-2 mb-4"><div className="p-2 bg-green-50 rounded-lg"><Receipt size={18} className="text-green-600" /></div><h2 className="font-semibold" style={{color:'var(--text-primary)'}}>Sirket ve Fatura Ayarlari</h2></div>
          <div className="space-y-3">
            {[['company_name','Sirket Adi'],['company_sub','Alt Baslik']].map(([k,l]) => (
              <div key={k}><label className="block text-sm font-medium mb-1" style={{color:'var(--text-primary)'}}>{l}</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm" style={{backgroundColor:'var(--bg-input)',borderColor:'var(--border)',color:'var(--text-primary)'}} value={company[k]} onChange={e => setCompany(c=>({...c,[k]:e.target.value}))} /></div>
            ))}
            <div><label className="block text-sm font-medium mb-1" style={{color:'var(--text-primary)'}}>KDV Orani (%)</label>
              <div className="flex items-center gap-3">
                <input type="number" min="0" max="100" className="w-28 border rounded-lg px-3 py-2 text-sm" style={{backgroundColor:'var(--bg-input)',borderColor:'var(--border)',color:'var(--text-primary)'}} value={company.kdv_rate} onChange={e => setCompany(c=>({...c,kdv_rate:Number(e.target.value)}))} />
                <div className="flex gap-1">{[0,1,8,10,18,20].map(r => (<button key={r} type="button" onClick={() => setCompany(c=>({...c,kdv_rate:r}))} className="text-xs px-2 py-1 rounded border" style={company.kdv_rate===r?{backgroundColor:'var(--accent)',color:'var(--accent-text)',borderColor:'var(--accent)'}:{color:'var(--accent)',borderColor:'var(--border)'}}> %{r}</button>))}</div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{color:'var(--text-primary)'}}>Varsayilan Birim</label>
              <div className="flex items-center gap-3">
                <input className="w-28 border rounded-lg px-3 py-2 text-sm" style={{backgroundColor:'var(--bg-input)',borderColor:'var(--border)',color:'var(--text-primary)'}}
                  value={company.default_unit||'kg'} onChange={e => setCompany(c=>({...c,default_unit:e.target.value}))} placeholder="kg" />
                <div className="flex flex-wrap gap-1">
                  {['kg','g','ton','lt','ml','adet','kutu','paket','metre','cm'].map(u => (
                    <button key={u} type="button" onClick={() => setCompany(c=>({...c,default_unit:u}))} className="text-xs px-2 py-1 rounded border"
                      style={(company.default_unit||'kg')===u?{backgroundColor:'var(--accent)',color:'var(--accent-text)',borderColor:'var(--accent)'}:{color:'var(--accent)',borderColor:'var(--border)'}}>
                      {u}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-xs mt-1" style={{color:'var(--text-secondary)'}}>Hammadde eklerken otomatik secilir</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{color:'var(--text-primary)'}}>Birim Listesi (virgul ile ayirin)</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm" style={{backgroundColor:'var(--bg-input)',borderColor:'var(--border)',color:'var(--text-primary)'}}
                value={company.weight_units||'kg,g,ton,lt,ml,adet,kutu,paket,metre,cm'} onChange={e => setCompany(c=>({...c,weight_units:e.target.value}))} placeholder="kg,g,ton,lt,ml,adet" />
              <p className="text-xs mt-1" style={{color:'var(--text-secondary)'}}>Bu liste hammadde formunda dropdown olarak gozukur</p>
            </div>
          </div>
          <button onClick={saveCompany} disabled={loading} className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg text-sm disabled:opacity-50" style={{backgroundColor:'var(--accent)',color:'var(--accent-text)'}}><Save size={15} /> {loading?'Kaydediliyor...':'Kaydet'}</button>
        </div>
      )}

      <div className="rounded-xl shadow-sm border p-5" style={{backgroundColor:'var(--bg-card)',borderColor:'var(--border)'}}>
        <div className="flex items-center gap-2 mb-4"><div className="p-2 bg-orange-50 rounded-lg"><KeyRound size={18} className="text-orange-600" /></div><h2 className="font-semibold" style={{color:'var(--text-primary)'}}>Sifre Degistir</h2></div>
        <div className="space-y-3">
          {[['current_password','Mevcut Sifre'],['new_password','Yeni Sifre'],['confirm','Yeni Sifre (Tekrar)']].map(([k,l]) => (
            <div key={k}><label className="block text-sm font-medium mb-1" style={{color:'var(--text-primary)'}}>{l}</label>
              <input type="password" className="w-full border rounded-lg px-3 py-2 text-sm" style={{backgroundColor:'var(--bg-input)',borderColor:'var(--border)',color:'var(--text-primary)'}} value={pw[k]} onChange={e => setPw(p=>({...p,[k]:e.target.value}))} /></div>
          ))}
        </div>
        <button onClick={savePassword} disabled={pwLoading} className="mt-4 flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 text-sm disabled:opacity-50"><KeyRound size={15} /> {pwLoading?'Kaydediliyor...':'Sifreyi Degistir'}</button>
      </div>

      {isAdmin && (
        <div className="rounded-xl shadow-sm border p-5" style={{backgroundColor:'var(--bg-card)',borderColor:'var(--border)'}}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2"><div className="p-2 bg-purple-50 rounded-lg"><Users size={18} className="text-purple-600" /></div><h2 className="font-semibold" style={{color:'var(--text-primary)'}}>Kullanici Yonetimi</h2></div>
            <button onClick={() => { setUserForm({username:'',email:'',password:'',role:'user'}); setUserModal('create') }} className="flex items-center gap-2 bg-purple-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-purple-700"><Plus size={14} /> Yeni Kullanici</button>
          </div>
          <div className="overflow-hidden rounded-lg border" style={{borderColor:'var(--border)'}}>
            <table className="w-full text-sm">
              <thead className="border-b" style={{backgroundColor:'var(--bg-table-head)',borderColor:'var(--border)'}}>
                <tr>{['Kullanici Adi','E-posta','Rol','Durum',''].map(h => <th key={h} className="px-4 py-2 text-left font-medium text-xs" style={{color:'var(--text-secondary)'}}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className={!u.is_active?'opacity-50':''} style={{borderTop:`1px solid var(--border)`,color:'var(--text-primary)'}}>
                    <td className="px-4 py-2 font-medium">{u.username}</td>
                    <td className="px-4 py-2 text-xs" style={{color:'var(--text-secondary)'}}>{u.email}</td>
                    <td className="px-4 py-2">{roleBadge(u.role)}</td>
                    <td className="px-4 py-2"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.is_active?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}>{u.is_active?'Aktif':'Pasif'}</span></td>
                    <td className="px-4 py-2"><div className="flex gap-1">
                      <button onClick={() => { setEditUser(u); setUserForm({username:u.username,email:u.email,password:'',role:u.role}); setUserModal('edit') }} className="text-blue-500 hover:text-blue-700 p-1"><Edit2 size={13} /></button>
                      <button onClick={() => toggleActive(u)} className="p-1" style={{color:'var(--text-secondary)'}}>{u.is_active?<ShieldOff size={13}/>:<ShieldCheck size={13}/>}</button>
                      <button onClick={() => deleteUser(u.id)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={13} /></button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isAdmin && (
        <div className="rounded-xl shadow-sm border p-5" style={{backgroundColor:'var(--bg-card)',borderColor:'var(--border)'}}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2"><div className="p-2 bg-red-50 rounded-lg"><ShieldAlert size={18} className="text-red-600" /></div><h2 className="font-semibold" style={{color:'var(--text-primary)'}}>Rol ve Yetki Yonetimi</h2></div>
            <button onClick={() => { setRoleForm({name:'',label:''}); setRoleModal(true) }} className="flex items-center gap-2 bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-red-700"><Plus size={14} /> Yeni Rol</button>
          </div>
          {customRoles.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {customRoles.map(r => (
                <div key={r.name} className="flex items-center gap-1 rounded-lg px-3 py-1 border" style={{backgroundColor:'rgba(59,130,246,0.08)',borderColor:'var(--border)'}}>
                  <Shield size={12} style={{color:'var(--accent)'}} />
                  <span className="text-sm font-medium" style={{color:'var(--accent)'}}>{r.label}</span>
                  <span className="text-xs" style={{color:'var(--text-secondary)'}}>({r.name})</span>
                  <button onClick={() => handleDeleteRole(r.name)} className="ml-1 text-red-400 hover:text-red-600"><Trash2 size={11} /></button>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs mb-3" style={{color:'var(--text-secondary)'}}>Admin rolunun yetkileri degistirilemez.</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {[...SYSTEM_ROLES, ...customRoles].map(r => (
              <button key={r.name} onClick={() => handlePermTabChange(r.name)} className="px-4 py-1.5 rounded-lg text-sm border font-medium transition-colors"
                style={permTab===r.name?{backgroundColor:'var(--accent)',color:'var(--accent-text)',borderColor:'var(--accent)'}:{color:'var(--text-secondary)',borderColor:'var(--border)'}}>
                {r.label}
              </button>
            ))}
          </div>
          <div className="overflow-x-auto rounded-lg border" style={{borderColor:'var(--border)'}}>
            <table className="w-full text-sm">
              <thead className="border-b" style={{backgroundColor:'var(--bg-table-head)',borderColor:'var(--border)'}}>
                <tr>
                  <th className="px-4 py-2 text-left font-medium" style={{color:'var(--text-secondary)'}}>Modul</th>
                  {ACTIONS.map(a => <th key={a} className="px-3 py-2 text-center font-medium" style={{color:'var(--text-secondary)'}}>{ACTION_LABELS[a]}</th>)}
                  <th className="px-3 py-2 text-center font-medium w-16" style={{color:'var(--text-secondary)'}}>Tumu</th>
                </tr>
              </thead>
              <tbody>
                {permModules.map(module => {
                  const allOn = ACTIONS.every(a => permData[module]?.[a])
                  return (
                    <tr key={module} style={{borderTop:`1px solid var(--border)`,color:'var(--text-primary)'}}>
                      <td className="px-4 py-2 font-medium">{MODULE_LABELS[module]||module}</td>
                      {ACTIONS.map(action => (
                        <td key={action} className="px-3 py-2 text-center">
                          <input type="checkbox" checked={permData[module]?.[action]??false} onChange={() => togglePerm(module, action)} className="w-4 h-4 cursor-pointer" style={{accentColor:'var(--accent)'}} />
                        </td>
                      ))}
                      <td className="px-3 py-2 text-center">
                        <button onClick={() => toggleRow(module)} className="text-xs px-2 py-0.5 rounded border"
                          style={allOn?{backgroundColor:'var(--accent)',color:'var(--accent-text)',borderColor:'var(--accent)'}:{color:'var(--text-secondary)',borderColor:'var(--border)'}}>
                          {allOn?'Kapat':'Ac'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {permDirty && (
            <button onClick={savePerms} className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg text-sm" style={{backgroundColor:'var(--accent)',color:'var(--accent-text)'}}><Save size={15} /> Yetkileri Kaydet</button>
          )}
        </div>
      )}

      {userModal && (
        <Modal title={userModal==='create'?'Yeni Kullanici':`Duzenle: ${editUser?.username}`} onClose={() => setUserModal(null)}>
          <div className="space-y-3">
            {userModal==='create' && (<div><label className="block text-sm font-medium mb-1">Kullanici Adi *</label><input className="w-full border rounded-lg px-3 py-2 text-sm" value={userForm.username} onChange={e => setUserForm(f=>({...f,username:e.target.value}))} /></div>)}
            <div><label className="block text-sm font-medium mb-1">E-posta *</label><input type="email" className="w-full border rounded-lg px-3 py-2 text-sm" value={userForm.email} onChange={e => setUserForm(f=>({...f,email:e.target.value}))} /></div>
            <div><label className="block text-sm font-medium mb-1">{userModal==='edit'?'Yeni Sifre (bos = degismez)':'Sifre *'}</label><input type="password" className="w-full border rounded-lg px-3 py-2 text-sm" value={userForm.password} onChange={e => setUserForm(f=>({...f,password:e.target.value}))} /></div>
            <div><label className="block text-sm font-medium mb-1">Rol</label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm" value={userForm.role} onChange={e => setUserForm(f=>({...f,role:e.target.value}))}>
                <option value="user">Kullanici (user)</option>
                <option value="admin">Admin</option>
                {customRoles.map(r => <option key={r.name} value={r.name}>{r.label}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleUserSave} className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 text-sm">Kaydet</button>
            <button onClick={() => setUserModal(null)} className="flex-1 border py-2 rounded-lg text-sm">Iptal</button>
          </div>
        </Modal>
      )}

      {roleModal && (
        <Modal title="Yeni Rol Olustur" onClose={() => setRoleModal(false)}>
          <div className="space-y-3">
            <div><label className="block text-sm font-medium mb-1">Rol Adi (slug) *</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="imalatci" value={roleForm.name} onChange={e => setRoleForm(f=>({...f,name:e.target.value.toLowerCase().replace(/\s/g,'_')}))} />
              <p className="text-xs mt-1" style={{color:'var(--text-secondary)'}}>Kucuk harf, bosluksuz. Ornek: imalatci, muhasebe</p>
            </div>
            <div><label className="block text-sm font-medium mb-1">Gorunen Ad *</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Imalatci" value={roleForm.label} onChange={e => setRoleForm(f=>({...f,label:e.target.value}))} />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleCreateRole} className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 text-sm">Olustur</button>
            <button onClick={() => setRoleModal(false)} className="flex-1 border py-2 rounded-lg text-sm">Iptal</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
