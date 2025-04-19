import { kv } from '@vercel/kv';

const CACHE_TTL = 60 * 60 * 24; // 24 hours in seconds

// Simple in-memory cache for development
const memoryCache = new Map<string, { data: string; timestamp: number }>();

export async function getCache(key: string): Promise<string | null> {
  try {
    // Try Vercel KV first
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      return await kv.get(key);
    }

    // Fallback to memory cache for development
    const cached = memoryCache.get(key);
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
    // Try Vercel KV first
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      await kv.set(key, value, { ex: CACHE_TTL });
      return;
    }

    // Fallback to memory cache for development
    memoryCache.set(key, {
      data: value,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error setting cache:', error);
  }
} 