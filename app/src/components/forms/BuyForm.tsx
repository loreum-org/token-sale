'use client';

import { useState, useEffect } from 'react';
import { isValidNumber, formatNumber, calculatePriceImpact } from '../../utils/calculations';
import useBondingCurve from '../../hooks/useBondingCurve';
import useWeb3 from '../../hooks/useWeb3';

interface BuyFormProps {
  currentPrice: string;
  onTransactionComplete: () => void;
}

const BuyForm = ({ currentPrice, onTransactionComplete }: BuyFormProps) => {
  const [ethAmount, setEthAmount] = useState<string>('');
  const [slippage, setSlippage] = useState<number>(0.5); // 0.5% default slippage
  const [transactionStatus, setTransactionStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [txError, setTxError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  
  const { isConnected } = useWeb3();
  const { 
    buyAmount, 
    buyLoading, 
    buyError,
    calculateBuy,
    executeBuy,
    transactionPending,
    setTransactionPending
  } = useBondingCurve();

  // Calculate output amount when ETH input changes
  useEffect(() => {
    if (isValidNumber(ethAmount) && parseFloat(ethAmount) > 0) {
      calculateBuy(ethAmount);
    } else {
      // Reset if input is invalid
      setEthAmount('');
    }
  }, [ethAmount, calculateBuy]);

  // Handle input change
  const handleEthAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || isValidNumber(value)) {
      setEthAmount(value);
    }
  };

  // Handle slippage change
  const handleSlippageChange = (value: number) => {
    setSlippage(value);
  };

  // Calculate price impact
  const priceImpact = isValidNumber(ethAmount) && isValidNumber(buyAmount) && buyAmount !== '0'
    ? calculatePriceImpact(ethAmount, currentPrice, buyAmount, 'buy')
    : 0;

  // Handle buy transaction
  const handleBuy = async () => {
    if (!isConnected) {
      setTxError('Please connect your wallet first');
      return;
    }

    if (!isValidNumber(ethAmount) || parseFloat(ethAmount) <= 0) {
      setTxError('Please enter a valid ETH amount');
      return;
    }

    try {
      setTransactionStatus('pending');
      setTransactionPending(true);
      setTxError(null);
      
      const tx = await executeBuy(ethAmount, slippage);
      
      if (tx) {
        setTxHash(tx.hash);
        await tx.wait();
        setTransactionStatus('success');
        onTransactionComplete();
        
        // Reset form after successful transaction
        setEthAmount('');
      } else {
        setTransactionStatus('error');
        setTxError('Transaction failed');
      }
    } catch (error) {
      console.error('Buy transaction error:', error);
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
    !isValidNumber(ethAmount) || 
    parseFloat(ethAmount) <= 0 ||
    !isConnected;

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Buy LORE Tokens</h2>
      
      <div className="space-y-4">
        {/* ETH Input */}
        <div>
          <label htmlFor="ethAmount" className="block text-sm font-medium text-gray-700">
            ETH Amount
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <input
              type="text"
              name="ethAmount"
              id="ethAmount"
              className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-3 pr-12 sm:text-sm border-gray-300 rounded-md"
              placeholder="0.0"
              value={ethAmount}
              onChange={handleEthAmountChange}
              disabled={transactionPending}
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">ETH</span>
            </div>
          </div>
        </div>
        
        {/* Token Output */}
        <div>
          <label htmlFor="tokenAmount" className="block text-sm font-medium text-gray-700">
            You Will Receive
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <input
              type="text"
              name="tokenAmount"
              id="tokenAmount"
              className="bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-3 pr-12 sm:text-sm border-gray-300 rounded-md"
              placeholder="0.0"
              value={buyAmount !== '0' ? formatNumber(buyAmount, 6) : ''}
              readOnly
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">LORE</span>
            </div>
          </div>
          {buyLoading && (
            <p className="mt-1 text-xs text-gray-500">Calculating...</p>
          )}
        </div>
        
        {/* Price Impact */}
        {priceImpact > 0 && (
          <div className="text-sm">
            <span className="text-gray-500">Price Impact:</span>{' '}
            <span className={`font-medium ${
              priceImpact < 0.01 ? 'text-green-600' : 
              priceImpact < 0.05 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {(priceImpact * 100).toFixed(2)}%
            </span>
          </div>
        )}
        
        {/* Slippage Settings */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Slippage Tolerance
          </label>
          <div className="flex space-x-2">
            {[0.1, 0.5, 1.0, 2.0].map((value) => (
              <button
                key={value}
                type="button"
                className={`px-3 py-1 text-sm rounded-md ${
                  slippage === value
                    ? 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                    : 'bg-gray-100 text-gray-800 border border-transparent hover:bg-gray-200'
                }`}
                onClick={() => handleSlippageChange(value)}
              >
                {value}%
              </button>
            ))}
          </div>
        </div>
        
        {/* Error Message */}
        {(txError || buyError) && (
          <div className="text-sm text-red-600">
            {txError || (buyError instanceof Error ? buyError.message : 'Error calculating buy amount')}
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
          onClick={handleBuy}
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
          ) : isConnected ? 'Buy Tokens' : 'Connect Wallet to Buy'}
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

export default BuyForm; 