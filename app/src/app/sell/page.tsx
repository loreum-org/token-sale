'use client';

import Layout from '../../components/layout/Layout';
import SellForm from '../../components/forms/SellForm';
import TokenMetrics from '../../components/charts/TokenMetrics';
import BondingCurveChart from '../../components/charts/BondingCurveChart';
import useTokenData from '../../hooks/useTokenData';
import useWeb3 from '../../hooks/useWeb3';

export default function SellPage() {
  const { isConnected } = useWeb3();
  const { tokenData, loading, error, refreshData } = useTokenData();

  const handleTransactionComplete = () => {
    refreshData();
  };

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Sell LORE Tokens</h1>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  {error.message || 'An error occurred while fetching token data. Please try again.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Not connected message */}
        {!isConnected && !loading && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-yellow-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Please connect your wallet to sell tokens.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="space-y-6">
              <TokenMetrics tokenData={tokenData} loading={loading} />
              <BondingCurveChart tokenData={tokenData} loading={loading} />
            </div>
          </div>
          <div>
            <SellForm
              tokenData={tokenData}
              currentPrice={tokenData?.currentPrice || '0'}
              onTransactionComplete={handleTransactionComplete}
            />
            
            {/* How It Works */}
            <div className="bg-white shadow rounded-lg p-6 mt-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">How It Works</h2>
              <div className="text-sm text-gray-600 space-y-3">
                <p>
                  LORE tokens can be sold back to the bonding curve at any time, with the price determined by the current supply.
                </p>
                <p>
                  1. Enter the amount of LORE tokens you want to sell
                </p>
                <p>
                  2. Review the amount of ETH you'll receive
                </p>
                <p>
                  3. Select your slippage tolerance
                </p>
                <p>
                  4. Click "Sell Tokens" to complete your sale
                </p>
                <p className="text-xs mt-4">
                  Note: When tokens are sold, they are returned to the bonding curve, and the price per token decreases accordingly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 