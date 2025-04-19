// Simple in-memory cache for development
const cache = new Map<string, { data: string; timestamp: number }>();
const CACHE_TTL = 60 * 60 * 24; // 24 hours in seconds

export async function getCache(key: string): Promise<string | null> {
  try {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL * 1000) {
      return cached.data;
    }
    return null;
  } catch (error) {
    console.error('Error getting from cache:', error);
    return null;
  }
}

export async function setCache(key: string, value: string): Promise<void> {
  try {
    cache.set(key, {
      data: value,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error setting cache:', error);
  }
} 