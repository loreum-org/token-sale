import { 
  getBondingCurveState, 
  updateBondingCurveState, 
  getUserWallet, 
  updateUserWallet,
  recordTransaction,
  getTransactionHistory,
  MOCK_ADDRESS 
} from '../db';

// Calculate token price based on supply and curve parameters
export function calculatePrice(supply: number, exponent: number, maxSupply: number, maxPrice: number): number {
  const normalizedSupply = supply / maxSupply;
  return (normalizedSupply ** exponent) * maxPrice;
}

// Get the current state of the bonding curve
export function getBondingCurveData() {
  try {
    const state = getBondingCurveState();
    if (!state) {
      throw new Error('Failed to get bonding curve state');
    }
    
    const currentPrice = calculatePrice(
      state.currentSupply, 
      state.exponent, 
      state.maxSupply, 
      state.maxPrice
    );
    
    return {
      currentSupply: state.currentSupply,
      reserveBalance: state.reserveBalance,
      exponent: state.exponent,
      maxSupply: state.maxSupply,
      maxPrice: state.maxPrice,
      currentPrice
    };
  } catch (error) {
    console.error('Error getting bonding curve data:', error);
    throw error;
  }
}

// Get user wallet data
export function getUserData(walletAddress: string = MOCK_ADDRESS) {
  try {
    const wallet = getUserWallet(walletAddress);
    if (!wallet) {
      throw new Error('Failed to get user wallet');
    }
    
    return {
      ethBalance: wallet.ethBalance,
      tokenBalance: wallet.tokenBalance
    };
  } catch (error) {
    console.error('Error getting user data:', error);
    throw error;
  }
}

// Calculate how many tokens you get for a given ETH amount
export function calculateBuyReturn(ethAmount: number): number {
  try {
    const state = getBondingCurveState();
    if (!state) {
      throw new Error('Failed to get bonding curve state');
    }
    
    // Check remaining supply
    const remainingSupply = state.maxSupply - state.currentSupply;
    if (remainingSupply <= 0) {
      throw new Error(`Maximum token supply of ${state.maxSupply.toLocaleString()} has been reached`);
    }
    
    // Get current price
    const currentPrice = calculatePrice(
      state.currentSupply, 
      state.exponent, 
      state.maxSupply, 
      state.maxPrice
    );
    
    // For small purchases, use simple division for gas efficiency
    // In a real contract, we would need to calculate the integral of the price curve
    const tokensToReceive = ethAmount / currentPrice;
    
    // Ensure we don't exceed max supply
    return Math.min(tokensToReceive, remainingSupply);
  } catch (error) {
    console.error('Error calculating buy return:', error);
    throw error;
  }
}

// Calculate how much ETH you get for selling tokens
export function calculateSellReturn(tokenAmount: number): number {
  try {
    const state = getBondingCurveState();
    if (!state) {
      throw new Error('Failed to get bonding curve state');
    }
    
    // Calculate new supply after selling
    const newSupply = state.currentSupply - tokenAmount;
    
    // Get price at new supply
    const priceAtNewSupply = calculatePrice(
      newSupply, 
      state.exponent, 
      state.maxSupply, 
      state.maxPrice
    );
    
    // For small sales, use simple multiplication for gas efficiency
    // In a real contract, we would need to calculate the integral of the price curve
    return tokenAmount * priceAtNewSupply;
  } catch (error) {
    console.error('Error calculating sell return:', error);
    throw error;
  }
}

// Buy tokens with ETH
export function buyTokens(ethAmount: number, walletAddress: string = MOCK_ADDRESS): { 
  tokensReceived: number, 
  ethBalance: number, 
  tokenBalance: number,
  currentPrice: number,
  currentSupply: number,
  reserveBalance: number
} {
  try {
    // Check arguments
    if (ethAmount <= 0) {
      throw new Error('ETH amount must be greater than 0');
    }
    
    // Get current state
    const state = getBondingCurveState();
    const wallet = getUserWallet(walletAddress);
    
    if (!state || !wallet) {
      throw new Error('Failed to get state or wallet');
    }
    
    // Check user balance
    if (wallet.ethBalance < ethAmount) {
      throw new Error('Insufficient ETH balance');
    }
    
    // Calculate tokens to receive
    const tokensReceived = calculateBuyReturn(ethAmount);
    
    // Calculate new supply
    const newSupply = state.currentSupply + tokensReceived;
    
    // Check if the transaction would exceed max supply
    if (newSupply > state.maxSupply) {
      throw new Error(`Transaction would exceed maximum token supply of ${state.maxSupply.toLocaleString()}`);
    }
    
    const newReserveBalance = state.reserveBalance + ethAmount;
    
    updateBondingCurveState({
      currentSupply: newSupply,
      reserveBalance: newReserveBalance
    });
    
    // Update user wallet
    const newEthBalance = wallet.ethBalance - ethAmount;
    const newTokenBalance = wallet.tokenBalance + tokensReceived;
    
    updateUserWallet(walletAddress, {
      ethBalance: newEthBalance,
      tokenBalance: newTokenBalance
    });
    
    // Record transaction
    const currentPrice = calculatePrice(
      state.currentSupply, 
      state.exponent, 
      state.maxSupply, 
      state.maxPrice
    );
    
    recordTransaction({
      userAddress: walletAddress,
      isBuy: true,
      ethAmount,
      tokenAmount: tokensReceived,
      pricePerToken: currentPrice
    });
    
    // Return updated data
    return {
      tokensReceived,
      ethBalance: newEthBalance,
      tokenBalance: newTokenBalance,
      currentPrice: calculatePrice(
        newSupply, 
        state.exponent, 
        state.maxSupply, 
        state.maxPrice
      ),
      currentSupply: newSupply,
      reserveBalance: newReserveBalance
    };
  } catch (error) {
    console.error('Error buying tokens:', error);
    throw error;
  }
}

// Sell tokens for ETH
export function sellTokens(tokenAmount: number, walletAddress: string = MOCK_ADDRESS): {
  ethReceived: number,
  ethBalance: number,
  tokenBalance: number,
  currentPrice: number,
  currentSupply: number,
  reserveBalance: number
} {
  try {
    // Check arguments
    if (tokenAmount <= 0) {
      throw new Error('Token amount must be greater than 0');
    }
    
    // Get current state
    const state = getBondingCurveState();
    const wallet = getUserWallet(walletAddress);
    
    if (!state || !wallet) {
      throw new Error('Failed to get state or wallet');
    }
    
    // Check user balance
    if (wallet.tokenBalance < tokenAmount) {
      throw new Error('Insufficient token balance');
    }
    
    // Calculate ETH to receive
    const ethReceived = calculateSellReturn(tokenAmount);
    
    // Update state
    const newSupply = state.currentSupply - tokenAmount;
    const newReserveBalance = state.reserveBalance - ethReceived;
    
    // Ensure we don't go below 0 for reserve balance
    if (newReserveBalance < 0) {
      throw new Error('Insufficient reserve balance');
    }
    
    updateBondingCurveState({
      currentSupply: newSupply,
      reserveBalance: newReserveBalance
    });
    
    // Update user wallet
    const newEthBalance = wallet.ethBalance + ethReceived;
    const newTokenBalance = wallet.tokenBalance - tokenAmount;
    
    updateUserWallet(walletAddress, {
      ethBalance: newEthBalance,
      tokenBalance: newTokenBalance
    });
    
    // Record transaction with the new price after selling
    const currentPrice = calculatePrice(
      newSupply, 
      state.exponent, 
      state.maxSupply, 
      state.maxPrice
    );
    
    recordTransaction({
      userAddress: walletAddress,
      isBuy: false,
      ethAmount: ethReceived,
      tokenAmount,
      pricePerToken: currentPrice
    });
    
    // Return updated data
    return {
      ethReceived,
      ethBalance: newEthBalance,
      tokenBalance: newTokenBalance,
      currentPrice: calculatePrice(
        newSupply, 
        state.exponent, 
        state.maxSupply, 
        state.maxPrice
      ),
      currentSupply: newSupply,
      reserveBalance: newReserveBalance
    };
  } catch (error) {
    console.error('Error selling tokens:', error);
    throw error;
  }
}

// Get transaction history
export function getTransactions(walletAddress: string = MOCK_ADDRESS) {
  try {
    return getTransactionHistory(walletAddress);
  } catch (error) {
    console.error('Error getting transaction history:', error);
    throw error;
  }
}

// Exponent is now fixed and cannot be changed 