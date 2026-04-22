// Service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/SE-Major-Project-HSC-Study-Platform/project_frontend/service-worker.js')
    .then(reg => console.log('Service Worker registered:', reg))
    .catch(err => console.log('Service Worker registration failed:', err));
}
