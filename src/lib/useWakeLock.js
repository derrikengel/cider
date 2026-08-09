// Keeps the screen awake while the consuming component is mounted, using the
// Screen Wake Lock API. Silently no-ops where unsupported (e.g. desktop
// Safari, older browsers) since this is a nice-to-have, not critical.
// Re-acquires on visibilitychange because the OS releases the lock whenever
// the tab is backgrounded (e.g. phone screen off), even briefly.

import { onMounted, onUnmounted } from 'vue'

export function useWakeLock() {
  let sentinel = null

  async function acquire() {
    if (!('wakeLock' in navigator)) return
    try {
      sentinel = await navigator.wakeLock.request('screen')
    } catch {
      sentinel = null
    }
  }

  function release() {
    sentinel?.release()
    sentinel = null
  }

  function onVisibilityChange() {
    if (document.visibilityState === 'visible') acquire()
  }

  onMounted(() => {
    acquire()
    document.addEventListener('visibilitychange', onVisibilityChange)
  })

  onUnmounted(() => {
    document.removeEventListener('visibilitychange', onVisibilityChange)
    release()
  })
}
