let staticCacheName = "Foodies-static-v1";
let imagesCacheName = "Foodies-images-v1";

let cacheNames = [staticCacheName, imagesCacheName];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(staticCacheName).then(cache => {
      cache.addAll([
        "./",
        "./restaurant.html",
        "./css/styles.css",
        "./js/dbhelper.js",
        "./js/main.js",
        "./js/idb.js",
        "./js/restaurant_info.js",
        "https://fonts.googleapis.com/css?family=Lato",
        "https://fonts.gstatic.com/s/lato/v14/S6uyw4BMUTPHjx4wXiWtFCc.woff2",
        "https://fonts.gstatic.com/s/lato/v14/S6uyw4BMUTPHjx4wXg.woff2",
        "https://unpkg.com/leaflet@1.3.1/dist/leaflet.css",
        "https://unpkg.com/leaflet@1.3.1/dist/leaflet.js",
        "https://unpkg.com/leaflet@1.3.1/dist/images/marker-icon.png",
        "https://unpkg.com/leaflet@1.3.1/dist/images/marker-icon-2x.png",
        "https://unpkg.com/leaflet@1.3.1/dist/images/marker-shadow.png"
      ]);
    })
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(cacheList => {
      cacheList
        .filter(staleCaches => {
          return (
            staleCaches.startsWith("Foodies") &&
            !cacheNames.includes(staleCaches)
          );
        })
        .map(deleteCache => {
          return caches.delete(deleteCache);
        });
    })
  );
});

self.addEventListener("fetch", event => {
  if (event.request.destination !== "image") {
    event.respondWith(
      caches.open(staticCacheName).then(cache => {
        const url = event.request.url.split("?")[0];
        if (url.includes("restaurant")) {
          return cache.match(url);
        }
        return cache.match(event.request).then(cacheResponse => {
          return (
            cacheResponse ||
            fetch(event.request, { cache: "default" }).then(networkResponse => {
              return caches.open(imagesCacheName).then(cache => {
                cache.put(event.request, networkResponse.clone());
                return networkResponse;
              });
            })
          );
        });
      })
    );
  } else {
    event.respondWith(
      caches.open(imagesCacheName).then(cache => {
        return cache.match(event.request.url).then(cacheResponse => {
          return (
            cacheResponse ||
            fetch(event.request, { cache: "default" }).then(networkResponse => {
              return caches.open(imagesCacheName).then(cache => {
                cache.put(event.request, networkResponse.clone());
                return networkResponse;
              });
            })
          );
        });
      })
    );
  }
});
