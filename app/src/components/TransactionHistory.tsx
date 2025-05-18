"use client";

import { Transaction } from "@/types";
import { formatEth, formatNumber, truncateAddress } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";

interface TransactionHistoryProps {
  transactions: Transaction[];
  isWalletConnected: boolean;
}

export function TransactionHistory({ transactions, isWalletConnected }: TransactionHistoryProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const transactionsPerPage = 7;
  
  const totalPages = Math.ceil(transactions.length / transactionsPerPage);
  const startIndex = (currentPage - 1) * transactionsPerPage;
  const endIndex = startIndex + transactionsPerPage;
  const currentTransactions = transactions.slice(startIndex, endIndex);

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  // Simulate loading state briefly when transactions change
  useEffect(() => {
    if (isWalletConnected) {
      setIsLoading(true);
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 500); // Short loading indicator for 500ms
      return () => clearTimeout(timer);
    }
  }, [transactions.length, isWalletConnected]);

  // Reset pagination when transactions change significantly
  useEffect(() => {
    setCurrentPage(1);
  }, [transactions.length]);

  return (
    <Card className="border border-gray-800 bg-gray-900/70 backdrop-blur-sm shadow-lg shadow-blue-500/5">
      <CardHeader className="border-b border-gray-800 pb-3">
        <CardTitle className="text-blue-400 flex items-center text-sm">
          <svg className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
          Your Transactions
        </CardTitle>
        <CardDescription className="text-gray-400 text-xs">
          {isWalletConnected 
            ? transactions.length > 0 
              ? `Showing ${startIndex + 1}-${Math.min(endIndex, transactions.length)} of ${transactions.length}`
              : "No transactions yet"
            : "Connect wallet to see transactions"}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-3">
            <div className="animate-pulse space-y-2">
              <div className="grid grid-cols-4 gap-2">
                <div className="h-2 bg-gray-800 rounded"></div>
                <div className="h-2 bg-gray-800 rounded"></div>
                <div className="h-2 bg-gray-800 rounded"></div>
                <div className="h-2 bg-gray-800 rounded"></div>
              </div>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="grid grid-cols-4 gap-2">
                  <div className="h-3 bg-gray-800 rounded"></div>
                  <div className="h-3 bg-gray-800 rounded"></div>
                  <div className="h-3 bg-gray-800 rounded"></div>
                  <div className="h-3 bg-gray-800 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        ) : transactions.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800/50">
                  <tr>
                    <th className="text-left py-2 px-2 text-xs font-medium text-gray-400">Type</th>
                    <th className="text-left py-2 px-2 text-xs font-medium text-gray-400">From</th>
                    <th className="text-right py-2 px-2 text-xs font-medium text-gray-400">LORE</th>
                    <th className="text-right py-2 px-2 text-xs font-medium text-gray-400">ETH</th>
                  </tr>
                </thead>
                <tbody>
                  {currentTransactions.map((tx) => (
                    <tr key={tx.id} className="border-t border-gray-800">
                      <td className="py-2 px-2">
                        <span
                          className={`inline-flex items-center justify-center text-xs font-medium px-1.5 py-0.5 rounded-sm ${
                            tx.isBuy ? "bg-green-900/20 text-green-400" : "bg-red-900/20 text-red-400"
                          }`}
                        >
                          {tx.isBuy ? "Buy" : "Sell"}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-xs text-gray-300 font-mono">
                        {tx.walletAddress ? truncateAddress(tx.walletAddress) : truncateAddress(tx.userAddress)}
                      </td>
                      <td className="py-2 px-2 text-right font-mono text-xs text-gray-300">{formatNumber(tx.tokenAmount, 0)}</td>
                      <td className="py-2 px-2 text-right font-mono text-xs text-gray-300">{formatEth(tx.ethAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls */}
            {transactions.length > transactionsPerPage && (
              <div className="flex items-center justify-between p-2 border-t border-gray-800">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className={`px-2 py-1 text-xs rounded-md ${
                    currentPage === 1
                      ? 'bg-gray-800/30 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  Previous
                </button>
                <span className="text-xs text-gray-400">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className={`px-2 py-1 text-xs rounded-md ${
                    currentPage === totalPages
                      ? 'bg-gray-800/30 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="py-4 text-center text-gray-400 text-xs">
            {isWalletConnected ? (
              <p>No transactions yet. Buy or sell tokens to get started!</p>
            ) : (
              <p>Connect your wallet to view your transaction history</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 