export const triggerHaptic = (pattern: 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'heartbeat' | 'ripple' | 'prayer' = 'light') => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    switch (pattern) {
      case 'light':
        navigator.vibrate(10);
        break;
      case 'medium':
        navigator.vibrate(25);
        break;
      case 'heavy':
        navigator.vibrate(50);
        break;
      case 'success':
        navigator.vibrate([10, 50, 20]);
        break;
      case 'error':
        navigator.vibrate([50, 50, 50]);
        break;
      case 'heartbeat':
        // Lub-dub, Lub-dub
        navigator.vibrate([80, 100, 80]);
        break;
      case 'ripple':
        // Soft cascading pulses
        navigator.vibrate([10, 30, 10, 40, 10, 50]);
        break;
      case 'prayer':
        // Low, rhythmic breathing cadence
        navigator.vibrate([200, 500, 200]);
        break;
    }
  }
};