// Benchmark-only assets. Keep original URL attributes for the independent oracle.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.hostname === 'images.unsplash.com')
    event.respondWith(fetch('/image.svg', { cache: 'force-cache' }));
  if (['fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname))
    event.respondWith(new Response('', { headers: { 'content-type': 'text/css' } }));
});
