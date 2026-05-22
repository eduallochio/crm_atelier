const CACHE_NAME = 'meu-atelier-v1'

// Recursos estáticos para cache offline
const STATIC_ASSETS = [
  '/login',
  '/favicon-32x32.png',
  '/logo-192.png',
  '/logo-512.png',
  '/apple-icon.png',
  '/manifest.json',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Não cachear API routes, autenticação ou recursos externos
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/_next/') ||
    url.origin !== self.location.origin
  ) {
    return
  }

  // Estratégia network-first: tenta rede, cai para cache se offline
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cacheia respostas bem-sucedidas de páginas
        if (response.ok && request.method === 'GET') {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
        }
        return response
      })
      .catch(() => caches.match(request).then((cached) => {
        if (cached) return cached
        // Fallback para offline: redireciona para login
        return caches.match('/login')
      }))
  )
})
