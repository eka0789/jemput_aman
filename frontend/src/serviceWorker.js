export const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return null;
  return navigator.serviceWorker.register('/service-worker.js');
};

