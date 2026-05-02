import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('laves_admin_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

export default api
