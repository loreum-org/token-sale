"use client";

import { useState } from "react";
import { ErrorBoundary, ErrorMessage } from "@/components/ErrorBoundary";
import { LoadingOverlay } from "@/components/LoadingSpinner";
import { BondingCurveChart } from "@/components/BondingCurveChart";
import { WalletCard } from "@/components/WalletCard";
import { ContractStats } from "@/components/ContractStats";
import { TransactionHistory } from "@/components/TransactionHistory";
import { TradingPanel } from "@/components/TradingPanel";
import { WalletConnect } from "@/components/WalletConnect";
import { useBondingCurve } from "@/hooks/useBondingCurve";
import { useAccount } from "wagmi";

export default function BondingCurvePage() {
  // Get data from our custom hook
  const { 
    state, 
    transactions, 
    loading, 
    error, 
    ethUsdPrice, 
    buyTokens, 
    sellTokens, 
    fetchData,
    calculatePrice 
  } = useBondingCurve();
  
  // Get wallet connection state
  const { isConnected } = useAccount();
  
  // Handle buy action
  const handleBuy = async (amount: number): Promise<void> => {
    await buyTokens(amount);
  };
  
  // Handle sell action
  const handleSell = async (amount: number): Promise<void> => {
    await sellTokens(amount);
  };
  
  return (
    <ErrorBoundary>
      <div className="container mx-auto py-8 bg-gray-950 text-gray-100 min-h-screen px-4">
        {/* Header with Logo and Wallet Connect */}
        <div className="flex items-center justify-between mb-6">
          <img 
            src="https://cdn.loreum.org/logos/white.svg" 
            alt="Loreum Logo" 
            className="h-12 w-auto"
          />
          <WalletConnect />
        </div>
        
        <h1 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent">
          LORE Token Bonding Curve Simulator
        </h1>
        
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center rounded-md bg-gray-900 p-2 border border-gray-800">
            <p className="text-sm text-blue-300">
              This is a simulation with persistent storage. All data is saved in SQLite.
            </p>
          </div>
        </div>
        
        {error && (
          <ErrorMessage 
            message={`Error: ${error}`} 
            onRetry={fetchData} 
          />
        )}
        
        {/* Layout grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          {/* Left column: Wallet and Contract Data */}
          <div className="lg:col-span-4 space-y-6">
            <WalletCard 
              state={state} 
              transactions={transactions} 
              ethUsdPrice={ethUsdPrice}
              isWalletConnected={isConnected}
            />
            <ContractStats 
              state={state} 
              ethUsdPrice={ethUsdPrice} 
            />
          </div>
          
          {/* Middle column: Chart */}
          <div className="lg:col-span-5">
            <div className="space-y-6">
              {/* Price Information - Moved to top */}
              <div className="w-full p-4 bg-gray-900/80 rounded-md border border-gray-800">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="block text-xs text-gray-400">Starting Price</span>
                    <span className="text-sm text-white font-mono">{0.0001.toFixed(6)} ETH</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-xs text-gray-400">Current Price</span>
                    <span className="text-lg font-bold text-blue-400 font-mono">{state?.currentPrice.toFixed(6)} ETH</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-xs text-gray-400">Max Price</span>
                    <span className="text-sm text-white font-mono">{state?.maxPrice.toFixed(6)} ETH</span>
                  </div>
                </div>
              </div>
              
              <BondingCurveChart 
                state={state} 
                calculatePrice={calculatePrice} 
              />
              
              {/* Mathematics Section */}
              <div className="w-full p-4 bg-gray-950 rounded-md text-white border border-gray-800 shadow-inner">
                <h3 className="text-md font-semibold text-blue-400 mb-2">Bonding Curve Mathematics</h3>
                <div className="bg-gray-900/70 rounded-md p-3 mt-2 font-mono">
                  <div className="mb-2">
                    <span className="text-gray-400 text-sm">Price calculation:</span>
                    <div className="mt-1 text-purple-300 text-center">
                      P(s) = (s/S)<sup>n</sup> × P<sub>max</sub>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-400 mt-3 grid grid-cols-2 gap-2">
                    <div>P(s) = Current price</div>
                    <div>s = Current supply</div>
                    <div>S = Max supply ({state?.maxSupply.toLocaleString()})</div>
                    <div>n = Exponent ({state?.exponent})</div>
                    <div>P<sub>max</sub> = Max price ({state?.maxPrice} ETH)</div>
                  </div>
                  
                  <div className="mt-3 text-sm text-blue-300">
                    This curve creates increasing price pressure as more tokens are purchased, rewarding early participants.
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right column: Buy/Sell Interface and Transaction History */}
          <div className="lg:col-span-3 space-y-6">
            <TradingPanel 
              state={state}
              isWalletConnected={isConnected}
              onBuy={handleBuy}
              onSell={handleSell}
              loading={loading}
            />
            
            <TransactionHistory 
              transactions={transactions} 
              isWalletConnected={isConnected} 
            />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
} 