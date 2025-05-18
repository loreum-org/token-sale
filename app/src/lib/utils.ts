import { PnLResult, Transaction, UserRankResult } from "@/types";

/**
 * Calculate Profit and Loss percentage and color
 * @param tokenBalance Current token balance
 * @param currentPrice Current token price
 * @param transactions List of user transactions
 * @returns PnL calculation result
 */
export function calculatePnL(
  tokenBalance: number,
  currentPrice: number,
  transactions: Transaction[]
): PnLResult {
  // Default return if no data
  if (!transactions || transactions.length === 0) {
    return {
      pnlPercentage: 0,
      pnlColor: "text-gray-300",
    };
  }

  // Calculate total spent and tokens bought
  let totalEthSpent = 0;
  let totalEthReceived = 0;
  let totalTokensBought = 0;
  let totalTokensSold = 0;

  transactions.forEach((tx) => {
    if (tx.isBuy) {
      totalEthSpent += tx.ethAmount;
      totalTokensBought += tx.tokenAmount;
    } else {
      totalEthReceived += tx.ethAmount;
      totalTokensSold += tx.tokenAmount;
    }
  });

  // Calculate current net token position
  const netTokens = totalTokensBought - totalTokensSold;

  // Current value of tokens
  const currentValue = tokenBalance * currentPrice;

  // Net spent (ETH spent - ETH received)
  const netSpent = totalEthSpent - totalEthReceived;

  // If no net tokens bought, can't calculate PnL
  if (netTokens <= 0 || netSpent <= 0) {
    return {
      pnlPercentage: 0,
      pnlColor: "text-gray-300",
    };
  }

  // Calculate PnL as percentage
  const pnlPercentage = ((currentValue - netSpent) / netSpent) * 100;

  // Determine color based on PnL
  let pnlColor = "text-gray-300";
  if (pnlPercentage > 0) {
    pnlColor = "text-green-400";
  } else if (pnlPercentage < 0) {
    pnlColor = "text-red-400";
  }

  return {
    pnlPercentage,
    pnlColor,
  };
}

/**
 * Calculate user rank compared to other users
 * @param tokenBalance Current token balance
 * @returns User rank information
 */
export function calculateUserRank(tokenBalance: number): UserRankResult {
  // Define tier thresholds (simulated)
  const tiers = [
    { name: "Whale", threshold: 10000, color: "text-blue-300" },
    { name: "Diamond", threshold: 5000, color: "text-teal-300" },
    { name: "Platinum", threshold: 1000, color: "text-purple-300" },
    { name: "Gold", threshold: 500, color: "text-yellow-300" },
    { name: "Silver", threshold: 100, color: "text-gray-300" },
    { name: "Bronze", threshold: 0, color: "text-orange-300" },
  ];

  // Determine user tier based on token balance
  const userTier = tiers.find((tier) => tokenBalance >= tier.threshold) || tiers[tiers.length - 1];

  // Simulated percentile calculation (higher is better)
  let percentile = 0;
  if (tokenBalance > 0) {
    // Using a function that maps token balance to percentile (0-100)
    // This is a simulated calculation - in a real app, you'd compare to actual user data
    percentile = Math.min(Math.log10(tokenBalance) * 20, 99);
  }

  return {
    percentile,
    rankText: userTier.name,
    rankColor: userTier.color,
  };
}

/**
 * Format number with comma separators and optional decimal places
 * @param num Number to format
 * @param decimals Number of decimal places
 * @returns Formatted number string
 */
export function formatNumber(num: number, decimals = 2): string {
  return num.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format ETH value with appropriate precision
 * @param ethValue ETH value
 * @returns Formatted ETH string
 */
export function formatEth(ethValue: number): string {
  if (ethValue < 0.001) {
    return ethValue.toFixed(6);
  } else if (ethValue < 0.01) {
    return ethValue.toFixed(5);
  } else if (ethValue < 0.1) {
    return ethValue.toFixed(4);
  } else if (ethValue < 1) {
    return ethValue.toFixed(3);
  } else {
    return ethValue.toFixed(2);
  }
}

/**
 * Format date from timestamp
 * @param timestamp ISO date string
 * @returns Formatted date string
 */
export function formatDate(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  });
}

/**
 * Truncate Ethereum address for display
 * @param address Full Ethereum address
 * @returns Truncated address
 */
export function truncateAddress(address: string): string {
  if (!address) return '';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
} 