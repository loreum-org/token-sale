"use client";

import { ConnectKitButton } from "connectkit";
import { useAccount } from "wagmi";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";

export function WalletConnect() {
  const { address, isConnected } = useAccount();
  const [shortAddress, setShortAddress] = useState<string>("");

  useEffect(() => {
    if (address) {
      // Format address to show only first 6 and last 4 characters
      setShortAddress(`${address.substring(0, 6)}...${address.substring(address.length - 4)}`);
    }
  }, [address]);

  return (
    <div className="flex justify-end mb-4">
      <ConnectKitButton.Custom>
        {({ isConnected, show, address, truncatedAddress }) => {
          return (
            <button
              onClick={show}
              className={`px-4 py-2 rounded-md font-medium flex items-center gap-2 transition-all duration-200 border ${
                isConnected
                  ? "bg-blue-900/30 text-blue-300 border-blue-700 hover:bg-blue-900/50"
                  : "bg-green-900/30 text-green-300 border-green-700 hover:bg-green-900/50"
              }`}
            >
              {isConnected ? (
                <>
                  <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></div>
                  <span>{truncatedAddress}</span>
                </>
              ) : (
                <>
                  <svg
                    className="h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="11" width="18" height="10" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <span>Connect Wallet</span>
                </>
              )}
            </button>
          );
        }}
      </ConnectKitButton.Custom>
    </div>
  );
} 