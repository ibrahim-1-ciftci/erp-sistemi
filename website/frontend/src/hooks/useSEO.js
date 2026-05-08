import { useEffect } from 'react'

export default function useSEO({ title, description, image } = {}) {
  useEffect(() => {
    const siteName = 'Laves Kimya'
    const fullTitle = title ? `${title} | ${siteName}` : `${siteName} - Profesyonel Oto Bakım Ürünleri`
    const desc = description || 'Laves Kimya profesyonel oto bakım ürünleri üreticisi. Şampuan, cila, temizlik ve bakım ürünleri.'

    document.title = fullTitle

    const setMeta = (name, content, prop = false) => {
      const attr = prop ? 'property' : 'name'
      let el = document.querySelector(`meta[${attr}="${name}"]`)
      if (!el) { el = document.createElement('meta'); el.setAttribute(attr, name); document.head.appendChild(el) }
      el.setAttribute('content', content)
    }

    setMeta('description', desc)
    setMeta('og:title', fullTitle, true)
    setMeta('og:description', desc, true)
    setMeta('og:type', 'website', true)
    if (image) setMeta('og:image', image, true)
    setMeta('twitter:card', 'summary_large_image')
    setMeta('twitter:title', fullTitle)
    setMeta('twitter:description', desc)

    return () => { document.title = `${siteName} - Profesyonel Oto Bakım Ürünleri` }
  }, [title, description, image])
}
