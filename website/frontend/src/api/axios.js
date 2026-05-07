import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('laves_admin_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

api.interceptors.response.use(
  res => res,
  err => {
    // Sadece admin sayfasındayken ve gerçekten 401 geldiğinde yönlendir
    // window.location yerine flag kullan — hard redirect crash'e yol açıyor
    if (err.response?.status === 401) {
      const path = window.location.pathname
      if (path.startsWith('/admin') && path !== '/admin/login') {
        localStorage.removeItem('laves_admin_token')
        // Soft redirect: React Router'ı bozmamak için
        window.location.replace('/admin/login')
      }
    }
    return Promise.reject(err)
  }
)

export default api
