"use client";

import { CurveState, Transaction } from "@/types";
import { formatEth, formatNumber, calculatePnL, calculateUserRank } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";

interface WalletCardProps {
  state: CurveState | null;
  transactions: Transaction[];
  ethUsdPrice: number;
  isWalletConnected: boolean;
}

export function WalletCard({ state, transactions, ethUsdPrice, isWalletConnected }: WalletCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Update loading state when data changes
  useEffect(() => {
    setIsLoading(!state && isWalletConnected);
  }, [state, isWalletConnected]);

  // Calculate PnL
  const pnl = state 
    ? calculatePnL(state.tokenBalance, state.currentPrice, transactions) 
    : { pnlPercentage: 0, pnlColor: "text-gray-300" };

  // Calculate user rank
  const userRank = state 
    ? calculateUserRank(state.tokenBalance) 
    : { percentile: 0, rankText: "Bronze", rankColor: "text-orange-300" };

  return (
    <Card className="border border-gray-800 bg-gray-900/70 backdrop-blur-sm shadow-lg shadow-blue-500/5">
      <CardHeader className="border-b border-gray-800 pb-4">
        <CardTitle className="text-blue-400 flex items-center">
          <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" />
            <path d="M4 6v12c0 1.1.9 2 2 2h14v-4" />
            <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
          </svg>
          Your Wallet
        </CardTitle>
        <CardDescription className="text-gray-400">Your Balances</CardDescription>
      </CardHeader>
      <CardContent className="py-4">
        {isWalletConnected ? (
          isLoading ? (
            <div className="py-4 space-y-4">
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-400">ETH Balance:</span>
                <div className="h-6 w-24 bg-gray-800 animate-pulse rounded"></div>
              </div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-400">LORE Balance:</span>
                <div className="h-6 w-24 bg-gray-800 animate-pulse rounded"></div>
              </div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-400">LORE Value (USD):</span>
                <div className="h-6 w-24 bg-gray-800 animate-pulse rounded"></div>
              </div>
            </div>
          ) : state ? (
            <>
              <p className="flex justify-between items-center mb-4">
                <span className="text-gray-400">ETH Balance:</span> 
                <span className="text-xl font-mono font-bold text-blue-300">{formatEth(state.ethBalance)} ETH</span>
              </p>
              
              <p className="flex justify-between items-center mb-4">
                <span className="text-gray-400">LORE Balance:</span> 
                <span className="text-xl font-mono font-bold text-green-300">{formatNumber(state.tokenBalance, 4)} LORE</span>
              </p>
              
              {ethUsdPrice > 0 && (
                <p className="flex justify-between items-center mb-4">
                  <span className="text-gray-400">LORE Value (USD):</span> 
                  <span className="text-xl font-mono font-bold text-purple-300">
                    ${formatNumber(state.tokenBalance * state.currentPrice * ethUsdPrice, 2)}
                  </span>
                </p>
              )}
              
              <div className="bg-gray-800/50 rounded-md p-3 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-400 text-sm">Your P&L:</span>
                  <span className={`font-mono font-bold ${pnl.pnlColor}`}>
                    {pnl.pnlPercentage > 0 ? "+" : ""}{formatNumber(pnl.pnlPercentage, 2)}%
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Your Rank:</span>
                  <div className="flex items-center">
                    <span className={`font-mono font-bold ${userRank.rankColor}`}>
                      {userRank.rankText}
                    </span>
                    <span className="ml-2 text-xs text-gray-400">
                      (Top {formatNumber(100 - userRank.percentile, 0)}%)
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : null
        ) : (
          <div className="py-6 text-center text-gray-400">
            <p className="mb-4">Connect your wallet to see your balances</p>
            <p className="text-sm opacity-75">Buy and sell LORE tokens with your ETH</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 