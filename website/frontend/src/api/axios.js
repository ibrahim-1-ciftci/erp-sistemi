import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('laves_admin_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

// 401 gelirse token'ı sil ama ASLA otomatik redirect yapma.
// AdminLayout zaten token yoksa <Navigate> ile yönlendiriyor.
// Hard redirect (window.location) React render döngüsünü kırıyor → beyaz ekran.
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('laves_admin_token')
      // Redirect yok — AdminLayout'un kendi <Navigate> kontrolü devreye girer
    }
    return Promise.reject(err)
  }
)

export default api
