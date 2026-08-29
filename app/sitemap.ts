import { MetadataRoute } from 'next'
import { WEBSITE_URL } from '@/lib/company-config'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: WEBSITE_URL,
      lastModified: new Date(),
    },
    {
      url: `${WEBSITE_URL}/pricing`,
      lastModified: new Date(),
    },
    {
      url: `${WEBSITE_URL}/login`,
      lastModified: new Date(),
    },
    {
      url: `${WEBSITE_URL}/dashboard`,
      lastModified: new Date(),
    },
  ]
}
