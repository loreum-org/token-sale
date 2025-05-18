/**
 * Bonding curve state interface
 */
export interface CurveState {
  currentSupply: number;
  reserveBalance: number;
  exponent: number;
  maxSupply: number;
  maxPrice: number;
  currentPrice: number;
  ethBalance: number;
  tokenBalance: number;
}

/**
 * Transaction interface
 */
export interface Transaction {
  id: number;
  userAddress: string;
  isBuy: boolean;
  ethAmount: number;
  tokenAmount: number;
  pricePerToken: number;
  timestamp: string;
  walletAddress?: string;
}

/**
 * API Response for transactions
 */
export interface TransactionsResponse {
  transactions: Transaction[];
}

/**
 * PnL calculation result
 */
export interface PnLResult {
  pnlPercentage: number;
  pnlColor: string;
}

/**
 * User rank calculation result
 */
export interface UserRankResult {
  percentile: number;
  rankText: string;
  rankColor: string;
} 