'use client';

import { useState } from 'react';
import Layout from '../components/layout/Layout';
import TokenMetrics from '../components/charts/TokenMetrics';
import BondingCurveChart from '../components/charts/BondingCurveChart';
import BuyForm from '../components/forms/BuyForm';
import useTokenData from '../hooks/useTokenData';
import useWeb3 from '../hooks/useWeb3';

export default function Home() {
  const { isConnected } = useWeb3();
  const { tokenData, loading, error, refreshData } = useTokenData();
  const [activeTab, setActiveTab] = useState<'overview' | 'buy'>('overview');

  const handleTransactionComplete = () => {
    refreshData();
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">LORE Token Dashboard</h1>
          
          {/* Tabs for mobile view */}
          <div className="sm:hidden">
            <select
              id="tabs"
              name="tabs"
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value as 'overview' | 'buy')}
            >
              <option value="overview">Overview</option>
              <option value="buy">Buy Tokens</option>
            </select>
          </div>
          
          {/* Tabs for larger screens */}
          <div className="hidden sm:block">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`${
                    activeTab === 'overview'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('buy')}
                  className={`${
                    activeTab === 'buy'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
                >
                  Buy Tokens
                </button>
              </nav>
            </div>
          </div>
        </div>

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
                  Please connect your wallet to access all features.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main content */}
        <div className={activeTab === 'overview' ? 'block' : 'hidden'}>
          <div className="grid grid-cols-1 gap-6">
            <TokenMetrics tokenData={tokenData} loading={loading} />
            <BondingCurveChart tokenData={tokenData} loading={loading} />
          </div>
        </div>

        <div className={activeTab === 'buy' ? 'block' : 'hidden'}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <BondingCurveChart tokenData={tokenData} loading={loading} />
            </div>
            <div>
              <BuyForm
                currentPrice={tokenData?.currentPrice || '0'}
                onTransactionComplete={handleTransactionComplete}
              />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
