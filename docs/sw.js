/* Chrome may request /sw.js when a service worker was previously registered for
   this origin (e.g. another project on localhost:8080). A missing file causes 404
   noise in the server log. This worker replaces any stale registration and
   immediately unregisters itself; it does not cache assets. */
self.addEventListener("install", function () {
    self.skipWaiting();
});
self.addEventListener("activate", function (event) {
    event.waitUntil(self.registration.unregister());
});
