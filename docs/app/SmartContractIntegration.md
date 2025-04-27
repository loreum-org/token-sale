# Smart Contract Integration

This document details how the LORE Token Sale application integrates with the underlying smart contracts.

## Contract Overview

The application interacts with two primary smart contracts:

1. **LORE Token (ERC20)**
   - Standard-compliant ERC20 token
   - Includes additional functions for supply management

2. **Bonding Curve**
   - Implements the [polynomial bonding curve](../contracts/SecurityConsiderations.md) algorithm
   - Manages the token price mechanism based on supply and reserve ratio
   - Handles buying and selling tokens with slippage protection

## Contract ABIs

The application includes the contract ABIs in the `app/src/config/abis` directory:

- `TokenABI.json`: Interface for the LORE token contract
- `BondingCurveABI.json`: Interface for the bonding curve contract

These ABIs are used to create contract instances for interaction with the blockchain.

## Web3 Service Layer

The `web3Service.ts` module provides the foundation for blockchain interaction:

```typescript
import { ethers } from 'ethers';
import TokenABI from '../config/abis/TokenABI.json';
import BondingCurveABI from '../config/abis/BondingCurveABI.json';

// Contract addresses (pulled from environment variables or configuration)
const TOKEN_ADDRESS = process.env.NEXT_PUBLIC_TOKEN_ADDRESS;
const BONDING_CURVE_ADDRESS = process.env.NEXT_PUBLIC_BONDING_CURVE_ADDRESS;

export const getProvider = () => {
  // Returns the appropriate Ethereum provider
};

export const getAccount = async () => {
  // Returns the connected user account
};

export const getTokenContract = () => {
  // Creates and returns an instance of the token contract
};

export const getBondingCurveContract = () => {
  // Creates and returns an instance of the bonding curve contract
};
```

## Token Service Layer

The `tokenService.ts` module abstracts interaction with the contracts:

```typescript
import { ethers } from 'ethers';
import { getBondingCurveContract, getTokenContract, getAccount } from './web3Service';

export const getTokenData = async () => {
  // Fetches token metrics from both contracts
};

export const calculateBuyAmount = async (ethAmount: string) => {
  // Calculates tokens received for a given ETH amount
};

export const calculateSellAmount = async (tokenAmount: string) => {
  // Calculates ETH received for a given token amount
};

export const buyTokens = async (ethAmount: string, slippagePercentage: number) => {
  // Executes token purchase with slippage protection
};

export const sellTokens = async (tokenAmount: string, slippagePercentage: number) => {
  // Executes token sale with slippage protection
};

export const getTransactionHistory = async () => {
  // Retrieves user's transaction history
};
```

## Integration Points

### 1. Wallet Connection

The application connects to blockchain wallets using:

- **Browser wallets** (MetaMask, Brave)
- **WalletConnect** for mobile wallets
- **Coinbase Wallet** integration

The connection is managed through the `useWeb3` hook, which provides:
- Connection status
- Account address
- Chain information
- Connection/disconnection methods

### 2. Data Fetching

Token and contract data are fetched in several ways:

- **Initial load**: Data is fetched when the application loads
- **Polling**: Regular updates (default 15s interval) for price and supply
- **Post-transaction**: Data is refreshed after each transaction
- **Manual refresh**: User can trigger data refresh

### 3. Transaction Flow

The transaction flow follows these steps:

1. **Preparation**:
   - User enters transaction parameters (ETH or token amount)
   - Application calculates expected return amount
   - Slippage tolerance is applied to calculate minimum acceptable return

2. **Approval** (for selling tokens):
   - If selling tokens, an approval transaction is required
   - The application checks current allowance before requesting approval
   - If allowance is sufficient, approval is skipped

3. **Execution**:
   - Transaction is sent to the blockchain
   - UI displays transaction status (pending, success, failed)
   - Transaction receipt is processed for confirmation

4. **Confirmation**:
   - Transaction receipt is monitored for confirmation
   - Data is refreshed once the transaction is confirmed
   - UI is updated with new balances and price

## Error Handling

The application handles several contract-related errors:

- **Rejected Transactions**: User-rejected transactions in wallet
- **Slippage Errors**: When price movement exceeds slippage tolerance
- **Gas Errors**: Insufficient gas or gas estimation failures
- **Balance Errors**: Insufficient token or ETH balance
- **Network Errors**: Wrong network or connection issues

Each error type has specific handling and user feedback in the UI.

## Security Considerations

The application implements several security features:

- **Read-only data separation**: Clear separation between read-only and state-changing functions
- **Transaction signing**: All transactions require explicit user approval through their wallet
- **Slippage protection**: Prevents front-running and unexpected price impact
- **Gas limit estimation**: Automatically calculates appropriate gas limits for transactions
- **Network validation**: Verifies the user is connected to the correct network 