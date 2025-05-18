import { CurveState, Transaction, TransactionsResponse } from "@/types";

// Cache implementation
type CacheEntry<T> = { data: T; expiry: number };
const cache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL = 15000; // 15 seconds cache duration

/**
 * Fetches data from an API endpoint with caching
 * @param url The URL to fetch from
 * @param forceRefresh Whether to bypass the cache
 * @returns The fetched data
 */
export async function fetchWithCache<T>(url: string, forceRefresh = false): Promise<T> {
  const cached = cache.get(url) as CacheEntry<T> | undefined;
  const now = Date.now();
  
  if (!forceRefresh && cached && cached.expiry > now) {
    return cached.data;
  }
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json() as T;
  
  cache.set(url, {
    data,
    expiry: now + CACHE_TTL
  });
  
  return data;
}

/**
 * Clears a specific cache entry or the entire cache
 * @param url Optional URL to clear from cache
 */
export function clearCache(url?: string): void {
  if (url) {
    cache.delete(url);
  } else {
    cache.clear();
  }
}

/**
 * Base API client for the bonding curve API
 */
export const bondingCurveApi = {
  baseUrl: '/api/bonding-curve',
  
  /**
   * Get bonding curve state
   * @param walletAddress Optional wallet address
   * @param forceRefresh Whether to bypass the cache
   */
  async getState(walletAddress?: string, forceRefresh = false): Promise<CurveState> {
    const walletParam = walletAddress ? `&walletAddress=${walletAddress}` : '';
    return fetchWithCache<CurveState>(`${this.baseUrl}?action=getState${walletParam}`, forceRefresh);
  },
  
  /**
   * Get transaction history
   * @param walletAddress Optional wallet address
   * @param forceRefresh Whether to bypass the cache
   */
  async getTransactions(walletAddress?: string, forceRefresh = false): Promise<Transaction[]> {
    const walletParam = walletAddress ? `&walletAddress=${walletAddress}` : '';
    const data = await fetchWithCache<TransactionsResponse>(`${this.baseUrl}?action=getTransactions${walletParam}`, forceRefresh);
    return data.transactions || [];
  },
  
  /**
   * Buy tokens
   * @param ethAmount ETH amount to spend
   * @param walletAddress Optional wallet address
   */
  async buyTokens(ethAmount: number, walletAddress?: string): Promise<CurveState> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'buy',
        ethAmount,
        walletAddress
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to buy tokens');
    }
    
    // Clear cache after mutation
    clearCache();
    
    return response.json();
  },
  
  /**
   * Sell tokens
   * @param tokenAmount Token amount to sell
   * @param walletAddress Optional wallet address
   */
  async sellTokens(tokenAmount: number, walletAddress?: string): Promise<CurveState> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'sell',
        tokenAmount,
        walletAddress
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to sell tokens');
    }
    
    // Clear cache after mutation
    clearCache();
    
    return response.json();
  }
}; 