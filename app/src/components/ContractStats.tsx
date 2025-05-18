"use client";

import { CurveState } from "@/types";
import { formatEth, formatNumber } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";

interface ContractStatsProps {
  state: CurveState | null;
  ethUsdPrice: number;
}

export function ContractStats({ state, ethUsdPrice }: ContractStatsProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Update loading state when data changes
  useEffect(() => {
    setIsLoading(!state);
  }, [state]);

  // Calculate fully diluted valuation
  const fdv = state && ethUsdPrice 
    ? state.maxSupply * state.currentPrice * ethUsdPrice
    : 0;

  // Calculate current market cap
  const marketCap = state && ethUsdPrice
    ? state.currentSupply * state.currentPrice * ethUsdPrice
    : 0;

  return (
    <Card className="border border-gray-800 bg-gray-900/70 backdrop-blur-sm shadow-lg shadow-purple-500/5">
      <CardHeader className="border-b border-gray-800 pb-4">
        <CardTitle className="text-purple-400 flex items-center">
          <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 6V4c0-1.1.9-2 2-2h12c1.1 0 2 .9 2 2v2" />
            <path d="M22 8v10c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V8c0-1.1.9-2 2-2h16c1.1 0 2 .9 2 2Z" />
            <rect x="8" y="12" width="8" height="4" />
          </svg>
          Contract Stats
        </CardTitle>
        <CardDescription className="text-gray-400">Current Market Data</CardDescription>
      </CardHeader>
      <CardContent className="py-4">
        {isLoading ? (
          <div className="py-4 space-y-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-400">Token Supply:</span>
              <div className="h-6 w-24 bg-gray-800 animate-pulse rounded"></div>
            </div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-400">Current Price:</span>
              <div className="h-6 w-24 bg-gray-800 animate-pulse rounded"></div>
            </div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-400">Bonded ETH:</span>
              <div className="h-6 w-24 bg-gray-800 animate-pulse rounded"></div>
            </div>
          </div>
        ) : state ? (
          <>
            <p className="flex justify-between items-center mb-4">
              <span className="text-gray-400">Token Supply:</span> 
              <span className="text-xl font-mono font-bold text-green-300">
                {formatNumber(state.currentSupply, 0)} / {formatNumber(state.maxSupply, 0)}
              </span>
            </p>
            
            <p className="flex justify-between items-center mb-4">
              <span className="text-gray-400">Current Price:</span> 
              <span className="text-xl font-mono font-bold text-blue-300">{formatEth(state.currentPrice)} ETH</span>
            </p>
            
            <p className="flex justify-between items-center mb-4">
              <span className="text-gray-400">Bonded ETH:</span> 
              <span className="text-xl font-mono font-bold text-yellow-300">{formatEth(state.reserveBalance)} ETH</span>
            </p>
            
            {ethUsdPrice > 0 && (
              <>
                <p className="flex justify-between items-center mb-4">
                  <span className="text-gray-400">ETH Price (USD):</span> 
                  <span className="text-xl font-mono font-bold text-purple-300">
                    ${formatNumber(ethUsdPrice, 2)}
                  </span>
                </p>
                
                <div className="bg-gray-800/50 rounded-md p-3 mb-0">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-400 text-sm">Market Cap:</span>
                    <span className="font-mono font-bold text-green-400">
                      ${formatNumber(marketCap, 0)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Fully Diluted Value:</span>
                    <span className="font-mono font-bold text-blue-400">
                      ${formatNumber(fdv, 0)}
                    </span>
                  </div>
                </div>
              </>
            )}
          </>
        ) : (
          <div className="py-6 text-center text-gray-400">
            <p>No contract data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 