/* 오프라인 캐시. 파일을 바꿔 배포할 때 CACHE 버전을 올리면 확실히 갱신됩니다. */
const CACHE = "lunch-workout-v5";
const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./data.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS.map(u => new Request(u, { cache: "reload" })))).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// 캐시를 먼저 보여 주고, 뒤에서 네트워크로 새 버전을 받아 둡니다(stale-while-revalidate).
self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.open(CACHE).then(cache =>
      cache.match(req, { ignoreSearch: true }).then(cached => {
        // 브라우저 HTTP 캐시를 건너뛰고 서버에 확인해야 새 배포가 반영됩니다.
        const network = fetch(new Request(req.url, { cache: "no-cache" }))
          .then(res => {
            if (res && res.ok) cache.put(req, res.clone());
            return res;
          })
          .catch(() => cached || (req.mode === "navigate" ? cache.match("./index.html") : undefined));
        return cached || network;
      })
    )
  );
});
