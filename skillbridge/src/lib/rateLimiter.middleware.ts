type WindowEntry = { count: number; resetAt: number };

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQ = 60; // requests per window
const store = new Map<string, WindowEntry>();

export function rateLimit(key: string, max = MAX_REQ, windowMs = WINDOW_MS) {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: max - 1, resetAt: now + windowMs };
  }

  if (entry.count >= max) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  store.set(key, entry);
  return { allowed: true, remaining: max - entry.count, resetAt: entry.resetAt };
}
