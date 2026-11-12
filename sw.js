/* 吾日三省 · 离线缓存 Service Worker
   作用：首次联网打开后，把页面缓存到本地；之后断网也能打开继续刷题。
   更新页面后如需强制刷新缓存，把下面的版本号 +1 即可。 */
const CACHE = "wtt-ah-v1";
const CORE = ["./", "./index.html"];

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then((c) =>
      Promise.all(
        CORE.map((u) => c.add(new Request(u, { cache: "reload" })).catch(() => {}))
      )
    )
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // 不拦截 GitHub API 等跨域请求

  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const cp = res.clone();
          caches.open(CACHE).then((c) => c.put(req, cp));
          return res;
        })
        .catch(async () => {
          const hit =
            (await caches.match(req)) ||
            (await caches.match("./index.html")) ||
            (await caches.match("./"));
          return (
            hit ||
            new Response("当前离线且无缓存，请联网后重试。", {
              status: 503,
              headers: { "Content-Type": "text/plain;charset=utf-8" }
            })
          );
        })
    );
  }
});