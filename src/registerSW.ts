import { registerSW } from 'virtual:pwa-register';

// Auto-update every 3 hours (in milliseconds)
const UPDATE_INTERVAL = 3 * 60 * 60 * 1000;

const updateSW = registerSW({
  onRegisteredSW(swUrl, registration) {
    if (registration) {
      // Check for updates periodically
      setInterval(() => {
        registration.update();
      }, UPDATE_INTERVAL);
    }
  },
  onNeedRefresh() {
    // Auto-refresh when a new version is available
    updateSW(true);
  },
  onOfflineReady() {
    console.log('MAROM ready for offline use');
  },
});
