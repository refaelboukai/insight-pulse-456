import { registerSW } from 'virtual:pwa-register';

// Auto-update every 10 seconds (in milliseconds)
const UPDATE_INTERVAL = 10 * 1000;

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
