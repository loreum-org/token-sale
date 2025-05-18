import { ethers } from 'ethers';
import { getBondingCurveContract, getTokenContract, getAccount } from './web3Service';

export interface TokenData {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  maxSupply: string;
  currentPrice: string;
  userBalance: string;
  marketCap: string;
  fdv: string; // Fully Diluted Valuation
  reserveBalance: string;
}

export interface TransactionData {
  timestamp: number;
  isBuy: boolean;
  tokenAmount: string;
  ethAmount: string;
  price: string;
}

export const getTokenData = async (): Promise<TokenData> => {
  try {
    const tokenContract = getTokenContract();
    let bondingCurveContract;
    
    try {
      bondingCurveContract = getBondingCurveContract();
    } catch (err) {
      console.warn('Bonding curve contract not available:', err);
      bondingCurveContract = null;
    }
    
    const account = await getAccount();

    // Get token data (always available)
    const [name, symbol, decimals, totalSupply, maxSupply, userBalance] = await Promise.all([
      tokenContract.name(),
      tokenContract.symbol(),
      tokenContract.decimals(),
      tokenContract.totalSupply(),
      tokenContract.maxSupply ? tokenContract.maxSupply() : Promise.resolve(ethers.parseUnits('1000000000', 18)), // Default if no maxSupply
      tokenContract.balanceOf(account)
    ]);
    
    // Default values for bonding curve data
    let currentPrice = ethers.parseEther('0.001'); // Default price
    let marketCap = ethers.parseEther('0');  
    let fdv = ethers.parseEther('0');
    let reserveBalance = ethers.parseEther('0');
    
    // Try to get bonding curve data if available
    if (bondingCurveContract) {
      try {
        // Use individual try/catch blocks to get as much data as possible
        try {
          currentPrice = await bondingCurveContract.getCurrentPrice();
        } catch (e) {
          console.warn('Failed to get current price:', e);
        }
        
        try {
          marketCap = await bondingCurveContract.getMarketCap();
        } catch (e) {
          console.warn('Failed to get market cap:', e);
        }
        
        try {
          fdv = await bondingCurveContract.getFullyDilutedValuation();
        } catch (e) {
          console.warn('Failed to get FDV:', e);
        }
        
        try {
          reserveBalance = await bondingCurveContract.getReserveBalance();
        } catch (e) {
          console.warn('Failed to get reserve balance:', e);
        }
      } catch (e) {
        console.warn('Error fetching bonding curve data:', e);
      }
    }

    return {
      name,
      symbol,
      decimals,
      totalSupply: ethers.formatUnits(totalSupply, decimals),
      maxSupply: ethers.formatUnits(maxSupply, decimals),
      currentPrice: ethers.formatEther(currentPrice),
      userBalance: ethers.formatUnits(userBalance, decimals),
      marketCap: ethers.formatEther(marketCap),
      fdv: ethers.formatEther(fdv),
      reserveBalance: ethers.formatEther(reserveBalance)
    };
  } catch (error) {
    console.error('Error fetching token data:', error);
    throw error;
  }
};

export const calculateBuyAmount = async (ethAmount: string): Promise<string> => {
  try {
    const bondingCurveContract = getBondingCurveContract();
    const tokenContract = getTokenContract();

    // Parse the amount to wei
    const weiAmount = ethers.parseEther(ethAmount);
    
    // Handle potential overflow by breaking large amounts into smaller chunks
    let tokenAmount: bigint;
    
    try {
      // First try the direct calculation
      tokenAmount = await bondingCurveContract.calculateBuyReturn(weiAmount);
    } catch (error: unknown) {
      // If overflow occurred, use a chunked approach
      if (error && typeof error === 'object' && 'reason' in error && typeof error.reason === 'string' && error.reason.includes('OVERFLOW')) {
        console.log('Using chunked calculation to avoid overflow');
        
        // Break the calculation into smaller chunks (0.1 ETH each)
        const chunkSize = ethers.parseEther('0.1');
        let remainingAmount = weiAmount;
        tokenAmount = BigInt(0);
        
        // Process in chunks of 0.1 ETH until we've calculated the entire amount
        while (remainingAmount > BigInt(0)) {
          const currentChunk = remainingAmount > chunkSize ? chunkSize : remainingAmount;
          try {
            const chunkTokens = await bondingCurveContract.calculateBuyReturn(currentChunk);
            tokenAmount += chunkTokens;
            remainingAmount -= currentChunk;
          } catch (chunkError) {
            // If even small chunks fail, use an estimation based on current price
            console.warn('Chunk calculation failed, using price-based estimation', chunkError);
            const currentPrice = await bondingCurveContract.getCurrentPrice();
            // Estimate tokens: ETH / price (with slippage factor for safety)
            const slippageFactor = 0.8; // 20% slippage assumption for large amounts
            tokenAmount = (weiAmount * BigInt(Math.floor(slippageFactor * 1e18))) / currentPrice;
            break;
          }
        }
      } else {
        // If it's not an overflow error, rethrow
        throw error;
      }
    }
    
    const decimals = await tokenContract.decimals();
    return ethers.formatUnits(tokenAmount, decimals);
  } catch (error) {
    console.error('Error calculating buy amount:', error);
    throw error;
  }
};

export const calculateSellAmount = async (tokenAmount: string): Promise<string> => {
  try {
    const bondingCurveContract = getBondingCurveContract();
    const tokenContract = getTokenContract();

    const decimals = await tokenContract.decimals();
    const tokenWei = ethers.parseUnits(tokenAmount, decimals);
    const ethAmount = await bondingCurveContract.calculateSellReturn(tokenWei);

    return ethers.formatEther(ethAmount);
  } catch (error) {
    console.error('Error calculating sell amount:', error);
    throw error;
  }
};

export const buyTokens = async (ethAmount: string, slippagePercentage: number): Promise<ethers.TransactionResponse> => {
  try {
    const bondingCurveContract = getBondingCurveContract();
    const tokenContract = getTokenContract();
    
    const weiAmount = ethers.parseEther(ethAmount);
    
    // Use our improved calculateBuyAmount function instead of direct contract call
    const expectedTokensFormatted = await calculateBuyAmount(ethAmount);
    const decimals = await tokenContract.decimals();
    const expectedTokens = ethers.parseUnits(expectedTokensFormatted, decimals);
    
    // Calculate minimum tokens with slippage
    const minTokens = expectedTokens - (expectedTokens * BigInt(Math.floor(slippagePercentage * 100)) / BigInt(10000));
    
    // Execute the buy transaction
    const tx = await bondingCurveContract.buy(minTokens, { value: weiAmount });
    
    return tx;
  } catch (error) {
    console.error('Error buying tokens:', error);
    throw error;
  }
};

export const sellTokens = async (tokenAmount: string, slippagePercentage: number): Promise<ethers.TransactionResponse> => {
  try {
    const bondingCurveContract = getBondingCurveContract();
    const tokenContract = getTokenContract();
    
    // Get token decimals
    const decimals = await tokenContract.decimals();
    
    // Convert token amount to wei
    const tokenWei = ethers.parseUnits(tokenAmount, decimals);
    
    // Calculate minimum amount of ETH to receive (accounting for slippage)
    const expectedEth = await bondingCurveContract.calculateSellReturn(tokenWei);
    const minEth = expectedEth - (expectedEth * BigInt(Math.floor(slippagePercentage * 100)) / BigInt(10000));
    
    // Check and set allowance if needed
    const account = await getAccount();
    const currentAllowance = await tokenContract.allowance(account, bondingCurveContract.target);
    
    if (currentAllowance < tokenWei) {
      const approveTx = await tokenContract.approve(bondingCurveContract.target, tokenWei);
      await approveTx.wait();
    }
    
    // Execute the sell transaction
    const tx = await bondingCurveContract.sell(tokenWei, minEth);
    
    return tx;
  } catch (error) {
    console.error('Error selling tokens:', error);
    throw error;
  }
};

export const getTransactionHistory = async (): Promise<TransactionData[]> => {
  try {
    const bondingCurveContract = getBondingCurveContract();
    const tokenContract = getTokenContract();
    const account = await getAccount();
    
    // Get token decimals
    const decimals = await tokenContract.decimals();
    
    // Get raw transaction history
    const rawHistory = await bondingCurveContract.getTransactionHistory(account);
    
    // Format transaction data
    return rawHistory.map((transaction: { timestamp: bigint; isBuy: boolean; tokenAmount: bigint; ethAmount: bigint; price: bigint }) => ({
      timestamp: Number(transaction.timestamp),
      isBuy: transaction.isBuy,
      tokenAmount: ethers.formatUnits(transaction.tokenAmount, decimals),
      ethAmount: ethers.formatEther(transaction.ethAmount),
      price: ethers.formatEther(transaction.price)
    }));
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    throw error;
  }
};
