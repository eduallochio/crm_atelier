import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const page = (path: string, priority: number, changeFrequency: 'weekly' | 'monthly' | 'yearly') =>
    ({ url: `${SITE_URL}${path}`, lastModified: now, changeFrequency, priority })
  return [
    page('', 1, 'weekly'),
    page('/promo', 0.8, 'weekly'),
    page('/cadastro', 0.7, 'monthly'),
    page('/login', 0.4, 'monthly'),
    page('/termos', 0.2, 'yearly'),
    page('/privacidade', 0.2, 'yearly'),
    page('/lgpd', 0.2, 'yearly'),
  ]
}
