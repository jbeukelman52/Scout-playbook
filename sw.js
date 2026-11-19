// Scout Playbook offline app shell (generated into dist/sw.js at build time).
// Caches this site's built files so the installed app opens without internet.
// Only same-origin GETs are handled — Supabase (data/auth) is never cached here.
const CACHE = 'scout-shell-0cdcdc9e3e9c';
const FILES = ["./","index.html","favicon.png","manifest.webmanifest","privacy.html","terms.html","assets/logo-DwmgZJ-F.png","assets/index-C-Nc9b96.css","assets/index-DyE3ClU2.js","assets/html2canvas.esm-DXEQVQnt.js","assets/purify.es-18JuyMri.js","assets/index.es-B5nEc2wI.js"];
const scoped = (f) => new URL(f, self.registration.scope).href;

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES.map(scoped))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('scout-shell-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

/** Network first for the page itself (so an online visit gets the newest app),
 *  with a short timeout for flaky stadium Wi-Fi, falling back to the cache. */
async function page(request) {
  const cache = await caches.open(CACHE);
  try {
    const res = await Promise.race([
      fetch(request),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 4000)),
    ]);
    if (res && res.ok) cache.put(scoped('index.html'), res.clone());
    return res;
  } catch {
    return (await cache.match(scoped('index.html'), { ignoreVary: true })) || (await cache.match(scoped('./'))) || Response.error();
  }
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    event.respondWith(page(req));
    return;
  }
  // built files have content hashes → cache first is always correct
  event.respondWith(caches.match(req, { ignoreSearch: true, ignoreVary: true }).then((hit) => hit || fetch(req)));
});
