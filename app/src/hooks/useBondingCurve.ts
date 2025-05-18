import { useState, useEffect, useCallback } from "react";
import { bondingCurveApi } from "@/lib/api-client";
import { CurveState, Transaction } from "@/types";
import { useAccount } from "wagmi";
import { calculateBuyAmount, calculateSellAmount, buyTokens, sellTokens } from "../services/tokenService";

/**
 * Custom hook for interacting with the bonding curve
 */
export function useBondingCurve() {
  const [state, setState] = useState<CurveState | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [ethUsdPrice, setEthUsdPrice] = useState<number>(0);
  
  // Get wallet connection state
  const { address, isConnected } = useAccount();
  
  /**
   * Fetch ETH price from API
   */
  const fetchEthPrice = useCallback(async () => {
    try {
      const response = await fetch('https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD');
      const data = await response.json();
      if (data && data.USD) {
        setEthUsdPrice(data.USD);
      } else {
        // Fallback price
        setEthUsdPrice(3000);
      }
    } catch (err) {
      console.error('Error fetching ETH price:', err);
      setEthUsdPrice(3000);
    }
  }, []);
  
  /**
   * Fetch bonding curve data (state and transactions)
   */
  const fetchData = useCallback(async () => {
    try {
      // Only set loading to true on initial load, not on subsequent refreshes
      if (!state) {
        setLoading(true);
      }
      setError(null);
      
      // Use wallet address if connected
      const walletAddress = isConnected && address ? address : undefined;
      
      // Fetch data in parallel
      const [stateData, txData] = await Promise.all([
        bondingCurveApi.getState(walletAddress),
        bondingCurveApi.getTransactions(walletAddress)
      ]);
      
      setState(stateData);
      setTransactions(txData);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching bonding curve data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      setLoading(false);
    }
  }, [address, isConnected, state]);
  
  /**
   * Buy tokens
   * @param ethAmount Amount of ETH to spend
   */
  const buyTokens = useCallback(async (ethAmount: number) => {
    try {
      if (!state) {
        throw new Error('State not loaded');
      }
      
      if (ethAmount <= 0) {
        throw new Error('Please enter a valid ETH amount');
      }
      
      if (ethAmount > state.ethBalance) {
        throw new Error('Insufficient ETH balance');
      }
      
      if (!isConnected) {
        throw new Error('Please connect your wallet to trade');
      }
      
      // Set loading for UI elements but don't block the whole app
      setLoading(true);
      setError(null);
      
      const result = await bondingCurveApi.buyTokens(ethAmount, address);
      
      // Update state with new values in the background
      setState(prevState => ({
        ...prevState!,
        currentSupply: result.currentSupply,
        currentPrice: result.currentPrice,
        ethBalance: result.ethBalance,
        tokenBalance: result.tokenBalance,
        reserveBalance: result.reserveBalance,
      }));
      
      // Refresh transaction list in the background
      bondingCurveApi.getTransactions(address).then(transactions => {
        setTransactions(transactions);
      });
      
      setLoading(false);
      return result;
    } catch (err) {
      console.error('Error buying tokens:', err);
      setError(err instanceof Error ? err.message : 'Failed to buy tokens');
      setLoading(false);
      throw err;
    }
  }, [state, address, isConnected]);
  
  /**
   * Sell tokens
   * @param tokenAmount Amount of tokens to sell
   */
  const sellTokens = useCallback(async (tokenAmount: number) => {
    try {
      if (!state) {
        throw new Error('State not loaded');
      }
      
      if (tokenAmount <= 0) {
        throw new Error('Please enter a valid token amount');
      }
      
      if (tokenAmount > state.tokenBalance) {
        throw new Error('Insufficient token balance');
      }
      
      if (!isConnected) {
        throw new Error('Please connect your wallet to trade');
      }
      
      // Set loading for UI elements but don't block the whole app
      setLoading(true);
      setError(null);
      
      const result = await bondingCurveApi.sellTokens(tokenAmount, address);
      
      // Update state with new values in the background
      setState(prevState => ({
        ...prevState!,
        currentSupply: result.currentSupply,
        currentPrice: result.currentPrice,
        ethBalance: result.ethBalance,
        tokenBalance: result.tokenBalance,
        reserveBalance: result.reserveBalance,
      }));
      
      // Refresh transaction list in the background
      bondingCurveApi.getTransactions(address).then(transactions => {
        setTransactions(transactions);
      });
      
      setLoading(false);
      return result;
    } catch (err) {
      console.error('Error selling tokens:', err);
      setError(err instanceof Error ? err.message : 'Failed to sell tokens');
      setLoading(false);
      throw err;
    }
  }, [state, address, isConnected]);
  
  // Set up periodic background refresh
  useEffect(() => {
    // Initial fetch
    fetchEthPrice();
    fetchData();
    
    // Set up background refresh every 30 seconds
    const refreshInterval = setInterval(() => {
      fetchEthPrice();
      fetchData();
    }, 30000);
    
    return () => clearInterval(refreshInterval);
  }, [fetchEthPrice, fetchData]);
  
  // Calculate price for the chart
  const calculatePrice = useCallback((supply: number, exponent: number, maxSupply: number, maxPrice: number): number => {
    const normalizedSupply = supply / maxSupply;
    return (normalizedSupply ** exponent) * maxPrice;
  }, []);
  
  return {
    state,
    transactions,
    loading,
    error,
    ethUsdPrice,
    buyTokens,
    sellTokens,
    fetchData,
    calculatePrice,
  };
}

/**
 * Legacy compatibility interface for forms
 */
const useBondingCurveWithForms = () => {
  const [buyAmount, setBuyAmount] = useState<string>('0');
  const [sellAmount, setSellAmount] = useState<string>('0');
  const [buyLoading, setBuyLoading] = useState<boolean>(false);
  const [sellLoading, setSellLoading] = useState<boolean>(false);
  const [buyError, setBuyError] = useState<Error | null>(null);
  const [sellError, setSellError] = useState<Error | null>(null);
  const [transactionPending, setTransactionPending] = useState<boolean>(false);
  
  const calculateBuy = useCallback(async (ethAmount: string) => {
    if (!ethAmount || parseFloat(ethAmount) <= 0) {
      setBuyAmount('0');
      return;
    }
    
    setBuyLoading(true);
    setBuyError(null);
    
    try {
      const result = await calculateBuyAmount(ethAmount);
      setBuyAmount(result);
    } catch (error) {
      console.error('Error calculating buy amount:', error);
      setBuyError(error instanceof Error ? error : new Error('Failed to calculate buy amount'));
      setBuyAmount('0');
    } finally {
      setBuyLoading(false);
    }
  }, []);
  
  const calculateSell = useCallback(async (tokenAmount: string) => {
    if (!tokenAmount || parseFloat(tokenAmount) <= 0) {
      setSellAmount('0');
      return;
    }
    
    setSellLoading(true);
    setSellError(null);
    
    try {
      const result = await calculateSellAmount(tokenAmount);
      setSellAmount(result);
    } catch (error) {
      console.error('Error calculating sell amount:', error);
      setSellError(error instanceof Error ? error : new Error('Failed to calculate sell amount'));
      setSellAmount('0');
    } finally {
      setSellLoading(false);
    }
  }, []);
  
  const executeBuy = useCallback(async (ethAmount: string, slippagePercentage: number) => {
    try {
      return await buyTokens(ethAmount, slippagePercentage / 100);
    } catch (error) {
      console.error('Error executing buy:', error);
      throw error;
    }
  }, []);
  
  const executeSell = useCallback(async (tokenAmount: string, slippagePercentage: number) => {
    try {
      return await sellTokens(tokenAmount, slippagePercentage / 100);
    } catch (error) {
      console.error('Error executing sell:', error);
      throw error;
    }
  }, []);
  
  return {
    buyAmount,
    sellAmount,
    buyLoading,
    sellLoading,
    buyError,
    sellError,
    calculateBuy,
    calculateSell,
    executeBuy,
    executeSell,
    transactionPending,
    setTransactionPending,
  };
};

// Default export for backward compatibility
export default useBondingCurveWithForms;
