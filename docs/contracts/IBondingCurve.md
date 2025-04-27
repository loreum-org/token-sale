# IBondingCurve Interface

This document provides detailed information about the `IBondingCurve` interface, which defines the contract functions and events for the LORE token bonding curve implementation.

## Interface Overview

The `IBondingCurve` interface establishes a standardized way to interact with the bonding curve contract, defining functions for token buying and selling, price calculations, and administrative operations.

## Events

### TokensPurchased

```solidity
event TokensPurchased(address indexed buyer, uint256 ethAmount, uint256 tokenAmount);
```

Emitted when tokens are purchased from the bonding curve.

**Parameters:**
- `buyer`: Address that purchased the tokens
- `ethAmount`: Amount of ETH spent
- `tokenAmount`: Amount of tokens received

### TokensSold

```solidity
event TokensSold(address indexed seller, uint256 tokenAmount, uint256 ethAmount);
```

Emitted when tokens are sold back to the bonding curve.

**Parameters:**
- `seller`: Address that sold the tokens
- `tokenAmount`: Amount of tokens sold
- `ethAmount`: Amount of ETH received

### Paused

```solidity
event Paused(address account);
```

Emitted when the contract is paused.

**Parameters:**
- `account`: Address that paused the contract

### Unpaused

```solidity
event Unpaused(address account);
```

Emitted when the contract is unpaused.

**Parameters:**
- `account`: Address that unpaused the contract

### EthRecovered

```solidity
event EthRecovered(address indexed to, uint256 amount);
```

Emitted when excess ETH is recovered from the contract.

**Parameters:**
- `to`: Address receiving the ETH
- `amount`: Amount of ETH recovered

### ERC20Recovered

```solidity
event ERC20Recovered(address indexed token, address indexed to, uint256 amount);
```

Emitted when ERC20 tokens are recovered from the contract.

**Parameters:**
- `token`: Address of the ERC20 token
- `to`: Address receiving the tokens
- `amount`: Amount of tokens recovered

## Functions

### buy

```solidity
function buy(uint256 minReturn) external payable returns (uint256);
```

Allows a user to buy tokens with ETH.

**Parameters:**
- `minReturn`: Minimum amount of tokens the buyer expects to receive

**Returns:**
- Amount of tokens purchased

**Requirements:**
- The contract must not be paused
- The function must be called with a non-zero ETH amount
- The calculated token amount must be at least `minReturn`

### sell

```solidity
function sell(uint256 tokenAmount, uint256 minReturn) external returns (uint256);
```

Allows a user to sell tokens back to the contract.

**Parameters:**
- `tokenAmount`: Amount of tokens to sell
- `minReturn`: Minimum amount of ETH the seller expects to receive

**Returns:**
- Amount of ETH received

**Requirements:**
- The contract must not be paused
- The `tokenAmount` must be greater than zero
- The calculated ETH return must be at least `minReturn`
- The contract must have sufficient ETH reserve

### calculateBuyReturn

```solidity
function calculateBuyReturn(uint256 ethAmount) external view returns (uint256);
```

Calculates the amount of tokens that would be received for a given ETH amount.

**Parameters:**
- `ethAmount`: Amount of ETH to spend

**Returns:**
- Amount of tokens that would be received

### calculateSellReturn

```solidity
function calculateSellReturn(uint256 tokenAmount) external view returns (uint256);
```

Calculates the amount of ETH that would be received for selling a given amount of tokens.

**Parameters:**
- `tokenAmount`: Amount of tokens to sell

**Returns:**
- Amount of ETH that would be received

### getReserveBalance

```solidity
function getReserveBalance() external view returns (uint256);
```

Returns the current reserve balance of the contract.

**Returns:**
- Current ETH balance of the contract

### getTokenAddress

```solidity
function getTokenAddress() external view returns (address);
```

Returns the address of the token used by the bonding curve.

**Returns:**
- Address of the token contract

### pause

```solidity
function pause() external;
```

Pauses all token purchases and sales.

**Requirements:**
- The contract must not already be paused
- The caller must be the contract owner

### unpause

```solidity
function unpause() external;
```

Unpauses the contract, allowing token purchases and sales again.

**Requirements:**
- The contract must be paused
- The caller must be the contract owner

### isPaused

```solidity
function isPaused() external view returns (bool);
```

Returns whether the contract is currently paused.

**Returns:**
- `true` if the contract is paused, `false` otherwise

## Interface Usage Examples

### Buying Tokens

```solidity
// Calculate the expected tokens
uint256 ethAmount = 1 ether;
uint256 expectedTokens = bondingCurve.calculateBuyReturn(ethAmount);

// Set slippage tolerance (2%)
uint256 minTokens = (expectedTokens * 98) / 100;

// Buy tokens
bondingCurve.buy{value: ethAmount}(minTokens);
```

### Selling Tokens

```solidity
// Calculate the expected ETH return
uint256 tokenAmount = 100 * 10**18; // 100 tokens with 18 decimals
uint256 expectedEth = bondingCurve.calculateSellReturn(tokenAmount);

// Set slippage tolerance (2%)
uint256 minEth = (expectedEth * 98) / 100;

// Approve tokens
IERC20(bondingCurve.getTokenAddress()).approve(address(bondingCurve), tokenAmount);

// Sell tokens
bondingCurve.sell(tokenAmount, minEth);
``` 