// Service Worker — Laves Kimya ERP
const CACHE = 'laves-erp-v1'

self.addEventListener('install', e => {
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Network-first strateji — her zaman güncel veri
self.addEventListener('fetch', e => {
  if (e.request.url.includes('/api/')) return // API isteklerini cache'leme
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  )
})
