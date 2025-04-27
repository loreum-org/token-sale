import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { 
  calculateBuyAmount, 
  calculateSellAmount, 
  buyTokens,
  sellTokens
} from '../services/tokenService';

interface UseBondingCurveReturn {
  // Buy functionality
  buyAmount: string;
  buyLoading: boolean;
  buyError: Error | null;
  calculateBuy: (ethAmount: string) => Promise<void>;
  executeBuy: (ethAmount: string, slippagePercentage: number) => Promise<ethers.TransactionResponse | null>;
  
  // Sell functionality
  sellAmount: string;
  sellLoading: boolean;
  sellError: Error | null;
  calculateSell: (tokenAmount: string) => Promise<void>;
  executeSell: (tokenAmount: string, slippagePercentage: number) => Promise<ethers.TransactionResponse | null>;
  
  // Transaction state
  transactionPending: boolean;
  setTransactionPending: (pending: boolean) => void;
}

export const useBondingCurve = (): UseBondingCurveReturn => {
  // Buy state
  const [buyAmount, setBuyAmount] = useState<string>('0');
  const [buyLoading, setBuyLoading] = useState<boolean>(false);
  const [buyError, setBuyError] = useState<Error | null>(null);
  
  // Sell state
  const [sellAmount, setSellAmount] = useState<string>('0');
  const [sellLoading, setSellLoading] = useState<boolean>(false);
  const [sellError, setSellError] = useState<Error | null>(null);
  
  // Transaction state
  const [transactionPending, setTransactionPending] = useState<boolean>(false);

  // Calculate token amount for a buy
  const calculateBuy = useCallback(async (ethAmount: string) => {
    if (!ethAmount || parseFloat(ethAmount) <= 0) {
      setBuyAmount('0');
      return;
    }
    
    try {
      setBuyLoading(true);
      setBuyError(null);
      
      const amount = await calculateBuyAmount(ethAmount);
      setBuyAmount(amount);
    } catch (err) {
      console.error('Error calculating buy amount:', err);
      setBuyError(err instanceof Error ? err : new Error('Failed to calculate buy amount'));
      setBuyAmount('0');
    } finally {
      setBuyLoading(false);
    }
  }, []);
  
  // Calculate ETH amount for a sell
  const calculateSell = useCallback(async (tokenAmount: string) => {
    if (!tokenAmount || parseFloat(tokenAmount) <= 0) {
      setSellAmount('0');
      return;
    }
    
    try {
      setSellLoading(true);
      setSellError(null);
      
      const amount = await calculateSellAmount(tokenAmount);
      setSellAmount(amount);
    } catch (err) {
      console.error('Error calculating sell amount:', err);
      setSellError(err instanceof Error ? err : new Error('Failed to calculate sell amount'));
      setSellAmount('0');
    } finally {
      setSellLoading(false);
    }
  }, []);

  // Execute buy transaction
  const executeBuy = useCallback(async (ethAmount: string, slippagePercentage: number = 0.5): Promise<ethers.TransactionResponse | null> => {
    if (!ethAmount || parseFloat(ethAmount) <= 0) {
      setBuyError(new Error('Invalid ETH amount'));
      return null;
    }
    
    try {
      setTransactionPending(true);
      setBuyError(null);
      
      const tx = await buyTokens(ethAmount, slippagePercentage);
      return tx;
    } catch (err) {
      console.error('Error buying tokens:', err);
      setBuyError(err instanceof Error ? err : new Error('Failed to buy tokens'));
      return null;
    } finally {
      setTransactionPending(false);
    }
  }, []);
  
  // Execute sell transaction
  const executeSell = useCallback(async (tokenAmount: string, slippagePercentage: number = 0.5): Promise<ethers.TransactionResponse | null> => {
    if (!tokenAmount || parseFloat(tokenAmount) <= 0) {
      setSellError(new Error('Invalid token amount'));
      return null;
    }
    
    try {
      setTransactionPending(true);
      setSellError(null);
      
      const tx = await sellTokens(tokenAmount, slippagePercentage);
      return tx;
    } catch (err) {
      console.error('Error selling tokens:', err);
      setSellError(err instanceof Error ? err : new Error('Failed to sell tokens'));
      return null;
    } finally {
      setTransactionPending(false);
    }
  }, []);

  return {
    buyAmount,
    buyLoading,
    buyError,
    calculateBuy,
    executeBuy,
    
    sellAmount,
    sellLoading,
    sellError,
    calculateSell,
    executeSell,
    
    transactionPending,
    setTransactionPending
  };
};

export default useBondingCurve;
