import { kv } from '@vercel/kv';

interface SearchHistory {
  url: string;
  keyword: string;
  timestamp: number;
}

export async function saveToHistory(url: string, keyword: string): Promise<void> {
  try {
    const history: SearchHistory = {
      url,
      keyword,
      timestamp: Date.now()
    };

    await kv.lpush('seo_history', JSON.stringify(history));
    // Keep only the last 10 searches
    await kv.ltrim('seo_history', 0, 9);
  } catch (error) {
    console.error('Error saving to history:', error);
  }
}

export async function getHistory(): Promise<SearchHistory[]> {
  try {
    const history = await kv.lrange('seo_history', 0, -1);
    return history.map(item => JSON.parse(item));
  } catch (error) {
    console.error('Error getting history:', error);
    return [];
  }
} 