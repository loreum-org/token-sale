"use client";

import { useState } from "react";
import { CurveState } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatEth } from "@/lib/utils";

interface TradingPanelProps {
  state: CurveState | null;
  isWalletConnected: boolean;
  onBuy: (amount: number) => Promise<void>;
  onSell: (amount: number) => Promise<void>;
  loading: boolean;
}

export function TradingPanel({ 
  state, 
  isWalletConnected, 
  onBuy, 
  onSell, 
  loading 
}: TradingPanelProps) {
  const [ethAmount, setEthAmount] = useState<string>("1");
  const [tokenAmount, setTokenAmount] = useState<string>("100");
  const [error, setError] = useState<string | null>(null);
  
  // Handle buy button click
  const handleBuy = async () => {
    try {
      setError(null);
      const amount = parseFloat(ethAmount);
      
      if (isNaN(amount) || amount <= 0) {
        setError("Please enter a valid ETH amount");
        return;
      }
      
      await onBuy(amount);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to buy tokens");
    }
  };

  // Handle sell button click
  const handleSell = async () => {
    try {
      setError(null);
      const amount = parseFloat(tokenAmount);
      
      if (isNaN(amount) || amount <= 0) {
        setError("Please enter a valid token amount");
        return;
      }
      
      await onSell(amount);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sell tokens");
    }
  };
  
  return (
    <Tabs defaultValue="buy" className="w-full">
      <TabsList className="grid grid-cols-2 w-full bg-gray-800/40 mb-4">
        <TabsTrigger value="buy" className="data-[state=active]:bg-green-900/20 data-[state=active]:text-green-400">
          Buy LORE
        </TabsTrigger>
        <TabsTrigger value="sell" className="data-[state=active]:bg-red-900/20 data-[state=active]:text-red-400">
          Sell LORE
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="buy" className="mt-0">
        <Card className="border border-gray-800 bg-gray-900/70 backdrop-blur-sm shadow-lg shadow-green-500/5">
          <CardHeader className="border-b border-gray-800 pb-4">
            <CardTitle className="text-green-400">Buy LORE Tokens</CardTitle>
            <CardDescription className="text-gray-400">
              Current Price: {state ? formatEth(state.currentPrice) : "0.0000"} ETH per LORE
            </CardDescription>
          </CardHeader>
          <CardContent className="py-4">
            <div className="space-y-4">
              <div>
                <label htmlFor="ethAmount" className="block text-gray-400 text-sm mb-1">
                  ETH Amount to Spend
                </label>
                <Input
                  id="ethAmount"
                  type="number"
                  value={ethAmount}
                  onChange={(e) => setEthAmount(e.target.value)}
                  placeholder="ETH amount"
                  min="0"
                  step="0.01"
                  className="bg-gray-800/50 border-gray-700 text-white"
                  disabled={loading || !isWalletConnected}
                />
              </div>
              
              {error && (
                <div className="text-red-400 text-sm p-2 bg-red-900/20 rounded-md">
                  {error}
                </div>
              )}
              
              <Button 
                className="w-full bg-green-700 hover:bg-green-600 text-white"
                onClick={handleBuy}
                disabled={loading || !isWalletConnected}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em]"></span>
                    Processing...
                  </span>
                ) : "Buy LORE Tokens"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="sell" className="mt-0">
        <Card className="border border-gray-800 bg-gray-900/70 backdrop-blur-sm shadow-lg shadow-red-500/5">
          <CardHeader className="border-b border-gray-800 pb-4">
            <CardTitle className="text-red-400">Sell LORE Tokens</CardTitle>
            <CardDescription className="text-gray-400">
              Current Price: {state ? formatEth(state.currentPrice) : "0.0000"} ETH per LORE
            </CardDescription>
          </CardHeader>
          <CardContent className="py-4">
            <div className="space-y-4">
              <div>
                <label htmlFor="tokenAmount" className="block text-gray-400 text-sm mb-1">
                  LORE Amount to Sell
                </label>
                <Input
                  id="tokenAmount"
                  type="number"
                  value={tokenAmount}
                  onChange={(e) => setTokenAmount(e.target.value)}
                  placeholder="LORE amount"
                  min="0"
                  step="0.1"
                  className="bg-gray-800/50 border-gray-700 text-white"
                  disabled={loading || !isWalletConnected}
                />
              </div>
              
              {error && (
                <div className="text-red-400 text-sm p-2 bg-red-900/20 rounded-md">
                  {error}
                </div>
              )}
              
              <Button 
                className="w-full bg-red-700 hover:bg-red-600 text-white"
                onClick={handleSell}
                disabled={loading || !isWalletConnected}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em]"></span>
                    Processing...
                  </span>
                ) : "Sell LORE Tokens"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
} 