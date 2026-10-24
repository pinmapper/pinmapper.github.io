/** Short tick on supporting devices (Android). iOS Safari ignores it. */
export function tick() {
  try {
    navigator.vibrate?.(8)
  } catch {
    // unsupported
  }
}
