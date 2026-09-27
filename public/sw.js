// Safirdex does not currently use a Service Worker. This cleanup worker
// replaces and unregisters any legacy registration left on this origin.
globalThis.addEventListener("install", () => {
  void globalThis.skipWaiting();
});

globalThis.addEventListener("activate", (event) => {
  event.waitUntil(globalThis.registration.unregister());
});
