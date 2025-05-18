'use client';

import { useState, useEffect } from 'react';
import { isValidNumber, formatNumber, calculatePriceImpact } from '../../utils/calculations';
import useBondingCurve from '../../hooks/useBondingCurve';
import useWeb3 from '../../hooks/useWeb3';
import { TokenData } from '../../services/tokenService';

interface SellFormProps {
  tokenData: TokenData | null;
  currentPrice: string;
  onTransactionComplete: () => void;
}

const SellForm = ({ tokenData, currentPrice, onTransactionComplete }: SellFormProps) => {
  const [tokenAmount, setTokenAmount] = useState<string>('');
  const [slippage, setSlippage] = useState<number>(0.5); // 0.5% default slippage
  const [transactionStatus, setTransactionStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [txError, setTxError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  
  const { isConnected } = useWeb3();
  const { 
    sellAmount, 
    sellLoading, 
    sellError,
    calculateSell,
    executeSell,
    transactionPending,
    setTransactionPending
  } = useBondingCurve();

  // Calculate output amount when token input changes
  useEffect(() => {
    if (isValidNumber(tokenAmount) && parseFloat(tokenAmount) > 0) {
      calculateSell(tokenAmount);
    } else {
      // Reset if input is invalid
      setTokenAmount('');
    }
  }, [tokenAmount, calculateSell]);

  // Handle input change
  const handleTokenAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || isValidNumber(value)) {
      setTokenAmount(value);
    }
  };

  // Set max token amount (user's balance)
  const handleSetMaxAmount = () => {
    if (tokenData && isValidNumber(tokenData.userBalance)) {
      setTokenAmount(tokenData.userBalance);
    }
  };

  // Handle slippage change
  const handleSlippageChange = (value: number) => {
    setSlippage(value);
  };

  // Calculate price impact
  const priceImpact = isValidNumber(tokenAmount) && isValidNumber(sellAmount) && sellAmount !== '0'
    ? calculatePriceImpact(tokenAmount, currentPrice, sellAmount, 'sell')
    : 0;

  // Handle sell transaction
  const handleSell = async () => {
    if (!isConnected) {
      setTxError('Please connect your wallet first');
      return;
    }

    if (!isValidNumber(tokenAmount) || parseFloat(tokenAmount) <= 0) {
      setTxError('Please enter a valid token amount');
      return;
    }

    if (tokenData && parseFloat(tokenAmount) > parseFloat(tokenData.userBalance)) {
      setTxError(`Insufficient balance. You only have ${tokenData.userBalance} LORE`);
      return;
    }

    try {
      setTransactionStatus('pending');
      setTransactionPending(true);
      setTxError(null);
      
      const tx = await executeSell(tokenAmount, slippage);
      
      if (tx) {
        setTxHash(tx.hash);
        await tx.wait();
        setTransactionStatus('success');
        onTransactionComplete();
        
        // Reset form after successful transaction
        setTokenAmount('');
      } else {
        setTransactionStatus('error');
        setTxError('Transaction failed');
      }
    } catch (error) {
      console.error('Sell transaction error:', error);
      setTransactionStatus('error');
      setTxError(error instanceof Error ? error.message : 'Transaction failed');
    } finally {
      setTransactionPending(false);
    }
  };

  // Determine button state
  const isButtonDisabled = 
    transactionPending || 
    transactionStatus === 'pending' || 
    !isValidNumber(tokenAmount) || 
    parseFloat(tokenAmount) <= 0 ||
    !isConnected ||
    (tokenData && parseFloat(tokenAmount) > parseFloat(tokenData.userBalance));

  return (
    <div className="bg-gray-900/70 border border-gray-800 shadow rounded-lg p-6">
      <h2 className="text-lg font-medium text-purple-400 mb-4">Sell LORE Tokens</h2>
      
      <div className="space-y-4">
        {/* Token Input */}
        <div>
          <div className="flex justify-between">
            <label htmlFor="tokenAmount" className="block text-sm font-medium text-gray-300">
              Token Amount
            </label>
            {tokenData && (
              <span className="text-xs text-gray-400">
                Balance: {formatNumber(tokenData.userBalance, 4)} LORE
              </span>
            )}
          </div>
          <div className="mt-1 relative rounded-md shadow-sm">
            <input
              type="text"
              name="tokenAmount"
              id="tokenAmount"
              className="bg-gray-800/50 border-gray-700 focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-3 pr-20 sm:text-sm rounded-md text-white"
              placeholder="0.0"
              value={tokenAmount}
              onChange={handleTokenAmountChange}
              disabled={transactionPending}
            />
            <div className="absolute inset-y-0 right-0 flex items-center">
              <button
                type="button"
                onClick={handleSetMaxAmount}
                className="px-2 py-1 mr-1 text-xs font-medium text-indigo-400 hover:text-indigo-300 hover:bg-indigo-900/50 rounded"
                disabled={Boolean(!tokenData) || transactionPending}
              >
                MAX
              </button>
              <div className="pr-3 flex items-center pointer-events-none">
                <span className="text-gray-400 sm:text-sm">LORE</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* ETH Output */}
        <div>
          <label htmlFor="ethAmount" className="block text-sm font-medium text-gray-300">
            You Will Receive
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <input
              type="text"
              name="ethAmount"
              id="ethAmount"
              className="bg-gray-800/50 border-gray-700 focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-3 pr-12 sm:text-sm rounded-md text-white"
              placeholder="0.0"
              value={sellAmount !== '0' ? formatNumber(sellAmount, 6) : ''}
              readOnly
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-400 sm:text-sm">ETH</span>
            </div>
          </div>
          {sellLoading && (
            <p className="mt-1 text-xs text-gray-400">Calculating...</p>
          )}
        </div>
        
        {/* Price Impact */}
        {priceImpact > 0 && (
          <div className="text-sm">
            <span className="text-gray-400">Price Impact:</span>{' '}
            <span className={`font-medium ${
              priceImpact < 0.01 ? 'text-green-400' : 
              priceImpact < 0.05 ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {(priceImpact * 100).toFixed(2)}%
            </span>
          </div>
        )}
        
        {/* Slippage Settings */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Slippage Tolerance
          </label>
          <div className="flex space-x-2">
            {[0.1, 0.5, 1.0, 2.0].map((value) => (
              <button
                key={value}
                type="button"
                className={`px-3 py-1 text-sm rounded-md ${
                  slippage === value
                    ? 'bg-indigo-800 text-indigo-200 border border-indigo-600'
                    : 'bg-gray-800 text-gray-300 border border-transparent hover:bg-gray-700'
                }`}
                onClick={() => handleSlippageChange(value)}
              >
                {value}%
              </button>
            ))}
          </div>
        </div>
        
        {/* Error Message */}
        {(txError || sellError) && (
          <div className="text-sm text-red-400 bg-red-900/20 p-2 rounded-md">
            {txError || (sellError instanceof Error ? sellError.message : 'Error calculating sell amount')}
          </div>
        )}
        
        {/* Submit Button */}
        <button
          type="button"
          className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
            isButtonDisabled
              ? 'bg-indigo-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
          }`}
          onClick={handleSell}
          disabled={isButtonDisabled}
        >
          {transactionStatus === 'pending' ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : isConnected ? 'Sell Tokens' : 'Connect Wallet to Sell'}
        </button>
        
        {/* Transaction Success */}
        {transactionStatus === 'success' && txHash && (
          <div className="mt-3 text-sm text-green-600">
            Transaction successful!{' '}
            <a 
              href={`https://etherscan.io/tx/${txHash}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline"
            >
              View on Etherscan
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellForm; 