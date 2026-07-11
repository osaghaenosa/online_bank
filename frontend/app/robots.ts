import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/dashboard/',
        '/admin/',
        '/auth/',
        '/profile/',
        '/account/',
        '/transfer/',
        '/withdraw/',
        '/deposit/',
        '/history/',
        '/receipts/',
        '/wealth/',
      ],
    },
    sitemap: 'https://nexabanking.com/sitemap.xml',
  }
}
