'use client';

import { formatNumber, formatPrice, formatLargeNumber } from '../../utils/calculations';
import { TokenData } from '../../services/tokenService';

interface TokenMetricsProps {
  tokenData: TokenData | null;
  loading: boolean;
}

const TokenMetrics = ({ tokenData, loading }: TokenMetricsProps) => {
  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex flex-col space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!tokenData) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center text-gray-500">
          Token data not available. Please connect your wallet.
        </div>
      </div>
    );
  }

  const metrics = [
    {
      title: 'Current Price',
      value: formatPrice(tokenData.currentPrice),
      subtext: `${tokenData.symbol} Token`
    },
    {
      title: 'Market Cap',
      value: formatLargeNumber(tokenData.marketCap),
      subtext: `Total: ${formatNumber(tokenData.totalSupply)} ${tokenData.symbol}`
    },
    {
      title: 'Fully Diluted Valuation',
      value: formatLargeNumber(tokenData.fdv),
      subtext: `Max: ${formatNumber(tokenData.maxSupply)} ${tokenData.symbol}`
    },
    {
      title: 'Reserve Balance',
      value: formatLargeNumber(tokenData.reserveBalance),
      subtext: 'ETH in contract'
    }
  ];

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Token Metrics</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <div key={index} className="flex flex-col">
            <dt className="text-sm font-medium text-gray-500">{metric.title}</dt>
            <dd className="mt-1 text-xl font-semibold text-gray-900">{metric.value}</dd>
            <dd className="mt-1 text-xs text-gray-500">{metric.subtext}</dd>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TokenMetrics; 