# Wallet Integration for Bonding Curve API

This document outlines how to modify the bonding curve API to support wallet addresses for the front-end Ethereum wallet integration.

## API Changes Required

1. Update the API endpoint to accept a `walletAddress` parameter in both GET and POST requests
2. Modify the database schema to associate transactions with Ethereum addresses
3. Update query logic to filter transactions by wallet address when provided

## Database Schema Updates

Add a `wallet_address` column to the `transactions` table:

```sql
ALTER TABLE transactions ADD COLUMN wallet_address TEXT;
```

## API Endpoint Modifications

### GET /api/bonding-curve?action=getState

Update to accept wallet address parameter and return balances for that specific wallet:

```js
// Extract wallet address if present
const walletAddress = req.query.walletAddress || null;

// Modify query to filter by wallet if address is provided
if (walletAddress) {
  // Get token balance for this specific wallet
  const walletBalance = await db.get(
    "SELECT SUM(CASE WHEN is_buy = 1 THEN token_amount ELSE -token_amount END) as token_balance FROM transactions WHERE wallet_address = ?",
    [walletAddress]
  );
  
  // Get ETH balance for this specific wallet (simulated)
  const ethBalance = 10.0; // This would be replaced with actual wallet balance logic
  
  // Return wallet-specific balances
  state.tokenBalance = walletBalance?.token_balance || 0;
  state.ethBalance = ethBalance;
}
```

### GET /api/bonding-curve?action=getTransactions

Update to filter transactions by wallet address:

```js
// Extract wallet address if present
const walletAddress = req.query.walletAddress || null;

// Base query
let query = "SELECT * FROM transactions";
let params = [];

// Add wallet filter if present
if (walletAddress) {
  query += " WHERE wallet_address = ?";
  params.push(walletAddress);
}

// Add order by
query += " ORDER BY id DESC";

const transactions = await db.all(query, params);
```

### POST /api/bonding-curve

Update to store wallet address with transactions:

```js
// Extract wallet address
const walletAddress = req.body.walletAddress || null;

// Add wallet address to transaction record
await db.run(
  "INSERT INTO transactions (user_address, is_buy, eth_amount, token_amount, price_per_token, timestamp, wallet_address) VALUES (?, ?, ?, ?, ?, ?, ?)",
  [
    "User1", // Legacy user ID field
    isBuy ? 1 : 0,
    ethAmount,
    tokenAmount,
    currentPrice,
    new Date().toISOString(),
    walletAddress // Store the Ethereum address
  ]
);
```

## Authentication Considerations

For a production system, consider:
1. Adding signature verification to ensure the wallet address belongs to the user
2. Implementing proper authentication flow with wallet signatures
3. Adding rate limiting to prevent abuse

This integration allows the simulation to work with real wallet addresses while maintaining the existing functionality for users without connected wallets. 