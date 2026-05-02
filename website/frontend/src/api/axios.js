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
    if (err.response?.status === 401) {
      const isAdminPath = window.location.pathname.startsWith('/admin')
      if (isAdminPath && window.location.pathname !== '/admin/login') {
        localStorage.removeItem('laves_admin_token')
        window.location.href = '/admin/login'
      }
    }
    return Promise.reject(err)
  }
)

export default api
