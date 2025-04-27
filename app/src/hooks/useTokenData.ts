import { useState, useEffect, useCallback } from 'react';
import { getTokenData, TokenData } from '../services/tokenService';
import useWeb3 from './useWeb3';

interface UseTokenDataReturn {
  tokenData: TokenData | null;
  loading: boolean;
  error: Error | null;
  refreshData: () => Promise<void>;
}

export const useTokenData = (): UseTokenDataReturn => {
  const { isConnected } = useWeb3();
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchTokenData = useCallback(async () => {
    if (!isConnected) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      const data = await getTokenData();
      setTokenData(data);
    } catch (err) {
      console.error('Error fetching token data:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch token data'));
    } finally {
      setLoading(false);
    }
  }, [isConnected]);

  useEffect(() => {
    // Only fetch data if wallet is connected
    if (isConnected) {
      fetchTokenData();
      
      // Set up interval to refresh data every 30 seconds
      const intervalId = setInterval(() => {
        fetchTokenData();
      }, 30000);
      
      // Clean up interval on unmount
      return () => clearInterval(intervalId);
    } else {
      // Reset data when disconnected
      setTokenData(null);
      setError(null);
    }
  }, [fetchTokenData, isConnected]);

  const refreshData = useCallback(async () => {
    if (isConnected) {
      await fetchTokenData();
    }
  }, [fetchTokenData, isConnected]);

  return { tokenData, loading, error, refreshData };
};

export default useTokenData;
