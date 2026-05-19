import { useEffect } from 'react'

const SITE_URL = 'https://laveskimya.com'
const SITE_NAME = 'Laves Kimya'

export default function useSEO({ title, description, image, url, jsonLd } = {}) {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} - Profesyonel Oto Bakım Ürünleri`
    const desc = description
      ? description.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().slice(0, 160)
      : 'Laves Kimya profesyonel oto bakım ürünleri üreticisi. Şampuan, cila, temizlik ve bakım ürünleri.'
    const canonical = url ? `${SITE_URL}${url}` : SITE_URL

    document.title = fullTitle

    const setMeta = (name, content, prop = false) => {
      const attr = prop ? 'property' : 'name'
      let el = document.querySelector(`meta[${attr}="${name}"]`)
      if (!el) { el = document.createElement('meta'); el.setAttribute(attr, name); document.head.appendChild(el) }
      el.setAttribute('content', content)
    }

    const setLink = (rel, href) => {
      let el = document.querySelector(`link[rel="${rel}"]`)
      if (!el) { el = document.createElement('link'); el.setAttribute('rel', rel); document.head.appendChild(el) }
      el.setAttribute('href', href)
    }

    // Temel meta
    setMeta('description', desc)
    setMeta('robots', 'index, follow')

    // Open Graph
    setMeta('og:title', fullTitle, true)
    setMeta('og:description', desc, true)
    setMeta('og:type', 'website', true)
    setMeta('og:url', canonical, true)
    setMeta('og:site_name', SITE_NAME, true)
    setMeta('og:locale', 'tr_TR', true)
    if (image) setMeta('og:image', image.startsWith('http') ? image : `${SITE_URL}${image}`, true)

    // Twitter Card
    setMeta('twitter:card', 'summary_large_image')
    setMeta('twitter:title', fullTitle)
    setMeta('twitter:description', desc)
    if (image) setMeta('twitter:image', image.startsWith('http') ? image : `${SITE_URL}${image}`)

    // Canonical
    setLink('canonical', canonical)

    // JSON-LD Structured Data
    const existingLd = document.querySelector('script[data-laves-jsonld]')
    if (existingLd) existingLd.remove()
    if (jsonLd) {
      const script = document.createElement('script')
      script.type = 'application/ld+json'
      script.setAttribute('data-laves-jsonld', '1')
      script.textContent = JSON.stringify(jsonLd)
      document.head.appendChild(script)
    }

    return () => {
      document.title = `${SITE_NAME} - Profesyonel Oto Bakım Ürünleri`
      const ld = document.querySelector('script[data-laves-jsonld]')
      if (ld) ld.remove()
    }
  }, [title, description, image, url, jsonLd])
}
