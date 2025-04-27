'use client';

import { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import TokenMetrics from '../../components/charts/TokenMetrics';
import { formatNumber, formatPrice } from '../../utils/calculations';
import useTokenData from '../../hooks/useTokenData';
import useWeb3 from '../../hooks/useWeb3';
import { getTransactionHistory, TransactionData } from '../../services/tokenService';

export default function PortfolioPage() {
  const { isConnected, account } = useWeb3();
  const { tokenData, loading, error } = useTokenData();
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState<boolean>(false);
  const [transactionsError, setTransactionsError] = useState<Error | null>(null);

  // Fetch transaction history
  useEffect(() => {
    const fetchTransactionHistory = async () => {
      if (!isConnected || !account) return;
      
      try {
        setTransactionsLoading(true);
        setTransactionsError(null);
        const history = await getTransactionHistory();
        setTransactions(history);
      } catch (err) {
        console.error('Error fetching transaction history:', err);
        setTransactionsError(err instanceof Error ? err : new Error('Failed to fetch transaction history'));
      } finally {
        setTransactionsLoading(false);
      }
    };

    fetchTransactionHistory();
  }, [isConnected, account]);

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Your Portfolio</h1>

        {/* Not connected message */}
        {!isConnected && (
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
                  Please connect your wallet to view your portfolio.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Portfolio Overview */}
        {isConnected && tokenData && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Your Holdings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="flex flex-col">
                <dt className="text-sm font-medium text-gray-500">LORE Balance</dt>
                <dd className="mt-1 text-xl font-semibold text-gray-900">
                  {formatNumber(tokenData.userBalance)} LORE
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-sm font-medium text-gray-500">Current Value</dt>
                <dd className="mt-1 text-xl font-semibold text-gray-900">
                  {formatPrice(
                    (parseFloat(tokenData.userBalance) * parseFloat(tokenData.currentPrice)).toString()
                  )}
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-sm font-medium text-gray-500">Current Price</dt>
                <dd className="mt-1 text-xl font-semibold text-gray-900">
                  {formatPrice(tokenData.currentPrice)}
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-sm font-medium text-gray-500">% of Supply</dt>
                <dd className="mt-1 text-xl font-semibold text-gray-900">
                  {tokenData.totalSupply !== '0'
                    ? `${((parseFloat(tokenData.userBalance) / parseFloat(tokenData.totalSupply)) * 100).toFixed(2)}%`
                    : '0%'
                  }
                </dd>
              </div>
            </div>
          </div>
        )}

        {/* Token Metrics */}
        <TokenMetrics tokenData={tokenData} loading={loading} />

        {/* Transaction History */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Transaction History</h2>
          
          {!isConnected ? (
            <div className="text-center text-gray-500 py-8">
              Connect your wallet to view your transaction history.
            </div>
          ) : transactionsLoading ? (
            <div className="animate-pulse space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          ) : transactionsError ? (
            <div className="text-center text-red-500 py-8">
              {transactionsError.message || 'Failed to load transaction history.'}
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No transactions found. Make a purchase to get started!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((tx, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(tx.timestamp * 1000).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <span className={`${
                          tx.isBuy ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {tx.isBuy ? 'Buy' : 'Sell'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatNumber(tx.tokenAmount)} LORE
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatPrice(tx.price)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatPrice(tx.ethAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
} 