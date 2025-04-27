# Application Architecture

This document outlines the technical architecture of the LORE Token Sale application.

## Technology Stack

The application is built using the following technologies:

- **Frontend**: Next.js 14 (React), TypeScript, Tailwind CSS
- **Blockchain Interaction**: ethers.js
- **Smart Contracts**: Solidity (^0.8.24)
- **Development Environment**: Hardhat, Foundry

## Application Structure

The application follows a modular architecture organized as follows:

```
app/
├── src/
│   ├── app/             # Next.js App Router pages
│   ├── components/      # Reusable UI components
│   ├── config/          # Configuration files and ABIs
│   ├── hooks/           # Custom React hooks
│   ├── services/        # API and blockchain services
│   └── utils/           # Utility functions
```

## Core Components

### 1. Pages

The application includes the following main pages:

- **Home/Dashboard** (`app/page.tsx`): Overview of token metrics and bonding curve
- **Buy** (`app/buy/page.tsx`): Interface for purchasing tokens
- **Sell** (`app/sell/page.tsx`): Interface for selling tokens
- **Portfolio** (`app/portfolio/page.tsx`): User's token holdings and transaction history

### 2. Components

Key components include:

- **Layout Components**: Navigation, header, footer
- **Chart Components**: Bonding curve visualization and token metrics
- **Form Components**: Buy and sell token forms with validation
- **Wallet Components**: Wallet connection and account display

### 3. Hooks

Custom React hooks handle:

- **Web3 Integration** (`useWeb3`): Manages wallet connection state and provider
- **Token Data** (`useTokenData`): Fetches and provides token metrics
- **Transaction State** (`useTransaction`): Manages transaction lifecycle and state

### 4. Services

Service modules handle external interactions:

- **Web3Service**: Manages blockchain connections and contract instances
- **TokenService**: Handles token-related operations and data fetching
- **StorageService**: Manages local storage of user preferences

## Data Flow

1. **User Authentication**:
   - User connects wallet through Web3 provider
   - Application reads connected address and network information

2. **Data Fetching**:
   - Token metrics are fetched from the blockchain on page load
   - Data is refreshed periodically and after transactions

3. **Transaction Flow**:
   - User initiates transaction (buy/sell)
   - Application calculates expected token/ETH amounts
   - Transaction is sent to blockchain via wallet
   - UI updates based on transaction status
   - Data refreshes once transaction is confirmed

## Smart Contract Integration

The application interacts with two main smart contracts:

1. **LORE Token** (`IERC20`): Standard ERC20 token with additional supply cap
2. **Bonding Curve** (`IBondingCurve`): Manages the token price mechanism and ETH reserve

Communication with these contracts is abstracted through the `tokenService.ts` module, which provides methods for:

- Fetching token data and metrics
- Calculating buy/sell amounts
- Executing buy/sell transactions
- Retrieving transaction history

## Responsive Design

The UI is built with a mobile-first approach using Tailwind CSS, with:

- Responsive layouts adapting to device size
- Optimized forms for mobile interaction
- Accessible UI components following WCAG guidelines

## Performance Considerations

The application implements several optimizations:

- Server-side rendering for initial page load
- Caching of static assets and blockchain data
- Lazy loading of components
- Debounced blockchain calls to reduce network load
- Memoization of expensive calculations 