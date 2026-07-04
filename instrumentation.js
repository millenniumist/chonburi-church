// Vercel reserves the TZ env var, so set it in-process before any route module
// evaluates a Date. Node flushes its date cache when process.env.TZ changes.
export function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    process.env.TZ = 'Asia/Bangkok';
  }
}
