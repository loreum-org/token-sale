# LORE Token Bonding Curve

## Overview

The BondingCurve contract implements a polynomial bonding curve mechanism for the LORE token sale. This system allows for automatic price determination based on token supply, providing a predictable, transparent, and fair pricing model.

## How It Works

### Bonding Curve Mechanics

The bonding curve uses a polynomial formula (`x^n`) where:
- `n` is the exponent parameter (typically between 1 and 3)
- The price of tokens increases as more tokens are purchased
- The price decreases as tokens are sold back to the contract

### Reserve Ratio System

The contract maintains a reserve ratio system where:
- A portion of ETH paid for tokens is kept as a reserve
- The reserve ratio is defined in parts per million (e.g., 100,000 = 10%)
- This ensures there is always sufficient ETH to buy back tokens
- Excess reserves (beyond what's required by the reserve ratio) can be withdrawn by the owner

### Price Calculation

Token prices are calculated dynamically based on:
- Current token supply
- Current ETH reserve balance
- The exponent parameter
- The reserve ratio

For small purchases/sales (amount < 10% of the reserve), a linear approximation is used for gas efficiency. For larger amounts, a more complex calculation is performed.

## Asset Flows

### Purchasing Tokens

1. User sends ETH to the contract via the `buy` function
2. Contract calculates token amount based on the bonding curve formula
3. ETH is added to the contract's reserve
4. Tokens are transferred from the contract to the buyer
5. A `TokensPurchased` event is emitted

### Selling Tokens

1. User calls the `sell` function with the amount of tokens they wish to sell
2. Contract calculates ETH return based on the bonding curve formula
3. Tokens are transferred from the seller to the contract
4. ETH is transferred from the contract reserve to the seller
5. A `TokensSold` event is emitted

### Reserve Management

- The contract must maintain a minimum reserve based on the current token supply and reserve ratio
- Excess reserves can be withdrawn by the owner via `recoverETH`
- The owner can recover other ERC20 tokens sent to the contract via `recoverERC20`

## Contract Management

### Initialization

The contract is initialized with the following parameters:
- Token address: Address of the ERC20 token being sold
- Exponent: The exponent for the polynomial curve formula (x^n)
- Reserve ratio: The ratio of reserve to market cap (in parts per million)

### Administrative Functions

As the contract owner, you can:

1. **Pause/Unpause**: Temporarily halt or resume token buying and selling
   ```solidity
   function pause() external onlyOwner
   function unpause() external onlyOwner
   ```

2. **Withdraw Excess Reserves**: Recover ETH beyond what's required by the reserve ratio
   ```solidity
   function recoverETH(address to, uint256 amount) external onlyOwner
   ```

3. **Recover Tokens**: Recover ERC20 tokens mistakenly sent to the contract
   ```solidity
   function recoverERC20(address tokenAddress, address to, uint256 amount) external onlyOwner
   ```

### Security Features

The contract includes several security features:
- ReentrancyGuard protection against reentrancy attacks
- Slippage protection for buyers and sellers
- Pause functionality for emergency situations
- Balance checks to ensure sufficient reserves
- Require statements to validate input parameters

## Function Reference

### Buy/Sell Functions

#### `buy(uint256 minReturn) external payable returns (uint256)`

Allows a user to purchase tokens by sending ETH.

**Parameters:**
- `minReturn`: Minimum amount of tokens expected (slippage protection)

**Returns:** Amount of tokens purchased

#### `sell(uint256 tokenAmount, uint256 minReturn) external returns (uint256)`

Allows a user to sell tokens back to the contract.

**Parameters:**
- `tokenAmount`: Amount of tokens to sell
- `minReturn`: Minimum amount of ETH expected (slippage protection)

**Returns:** Amount of ETH received

### Calculation Functions

#### `calculateBuyReturn(uint256 ethAmount) public view returns (uint256)`

Calculates the amount of tokens that would be received for a given ETH amount.

**Parameters:**
- `ethAmount`: Amount of ETH to spend

**Returns:** Amount of tokens that would be received

#### `calculateSellReturn(uint256 tokenAmount) public view returns (uint256)`

Calculates the amount of ETH that would be received for selling a given amount of tokens.

**Parameters:**
- `tokenAmount`: Amount of tokens to sell

**Returns:** Amount of ETH that would be received

### Admin Functions

#### `pause() external onlyOwner`

Pauses the contract, preventing buy and sell operations.

#### `unpause() external onlyOwner`

Unpauses the contract, allowing buy and sell operations.

#### `recoverETH(address to, uint256 amount) external onlyOwner`

Recovers excess ETH from the contract.

**Parameters:**
- `to`: Address to send the ETH to
- `amount`: Amount of ETH to recover

#### `recoverERC20(address tokenAddress, address to, uint256 amount) external onlyOwner`

Recovers ERC20 tokens sent to the contract.

**Parameters:**
- `tokenAddress`: Address of the ERC20 token
- `to`: Address to send the tokens to
- `amount`: Amount of tokens to recover

### View Functions

#### `getReserveBalance() external view returns (uint256)`

Returns the current ETH reserve balance.

**Returns:** Current reserve balance

#### `getTokenAddress() external view returns (address)`

Returns the address of the token being sold.

**Returns:** Address of the token contract

#### `isPaused() external view returns (bool)`

Returns whether the contract is currently paused.

**Returns:** True if paused, false otherwise

## Best Practices for Owners

1. **Initial Setup**: 
   - Set a reasonable exponent (1-3) based on desired price sensitivity
   - Choose a reserve ratio that balances security and capital efficiency (10-50%)

2. **Reserve Management**:
   - Monitor excess reserves regularly
   - Withdraw excess reserves periodically to fund development or other expenses
   - Always maintain the minimum required reserve ratio

3. **Emergency Situations**:
   - Use the pause function if suspicious activity is detected
   - Investigate thoroughly before unpausing
   - Consider reserve ratio adjustments if market conditions change dramatically

4. **Transparency**:
   - Communicate any parameter changes to the community in advance
   - Provide clear explanations for reserve withdrawals
   - Be transparent about pause/unpause decisions

## Common User Scenarios

### First-time Buyer
1. Connect wallet to the dApp
2. Enter ETH amount to spend
3. View expected token return and price impact
4. Set slippage tolerance
5. Confirm transaction

### Selling Tokens
1. Connect wallet to the dApp
2. Enter token amount to sell
3. View expected ETH return and price impact
4. Set slippage tolerance
5. Approve tokens for the contract
6. Confirm sell transaction 