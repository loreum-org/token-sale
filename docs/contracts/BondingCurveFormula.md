# Bonding Curve Formula Explained

This document provides a detailed explanation of the mathematical formulas used in the LORE token bonding curve implementation.

## Basic Concepts

A bonding curve is a mathematical curve that defines the relationship between a token's price and its supply. In the LORE implementation, we use a polynomial bonding curve with the following key characteristics:

- The price increases as the token supply increases
- The price decreases as the token supply decreases
- A reserve ratio determines the relationship between the ETH reserve and token market cap

## The Formula

The core formula used in the bonding curve calculation is:

```
return = supply * ((1 + amount / balance) ^ (ratio) - 1)
```

Where:
- `supply` is the current token supply
- `balance` is the current reserve balance
- `ratio` is the reserve ratio (as a fraction)
- `amount` is the amount being exchanged (ETH or tokens)
- `return` is the amount to be returned (tokens or ETH)

## Implementation Details

The contract implements two optimization approaches for different transaction sizes:

### 1. Linear Approximation (for small amounts)

For small transactions (amount < 10% of the reserve), we use a linear approximation:

```solidity
if (amount * 10 < balance) {
    // Using the linear approximation for small amounts
    return (supply * amount * ratio) / (balance * PPM);
}
```

This is based on the approximation formula:
```
(1 + x) ^ n ≈ 1 + n * x  (for small x)
```

Where in our case:
- `x` = amount / balance
- `n` = ratio / PPM

This approximation is very gas-efficient and accurate enough for small transactions.

### 2. Extended Approximation (for larger amounts)

For larger transactions, we use a more complex approximation:

```solidity
uint256 result = (supply * amount * ratio) / (balance * PPM);

if (exponent > 1) {
    result = (result * (PPM + (exponent - 1) * amount * PPM / balance)) / PPM;
}
```

This provides a more accurate result for larger transactions while still being gas-efficient.

## Buy/Sell Calculations

### Buy Calculation

When a user buys tokens with ETH:

1. We calculate the token supply (`tokenSupply = token.balanceOf(address(this))`)
2. We calculate the current reserve balance (`reserveBalance = address(this).balance - ethAmount`)
3. If this is the first purchase, we use the initial price formula: `(ethAmount * PPM) / reserveRatio`
4. Otherwise, we calculate the tokens to return using the bonding curve formula

### Sell Calculation

When a user sells tokens for ETH:

1. We calculate the token supply (`tokenSupply = token.balanceOf(address(this))`)
2. We calculate the current reserve balance (`reserveBalance = address(this).balance`)
3. If the user is selling all tokens, we return the entire reserve
4. Otherwise, we calculate the ETH to return using the bonding curve formula

## Reserve Ratio

The reserve ratio is a critical parameter that determines:

1. The slope of the bonding curve
2. The amount of ETH that must be kept in reserve
3. The price sensitivity to changes in supply

The reserve ratio is specified in parts per million (PPM) where:
- 1,000,000 = 100%
- 500,000 = 50%
- 100,000 = 10%

A lower reserve ratio makes the price more sensitive to supply changes, while a higher reserve ratio makes the price more stable.

## Market Cap Calculation

The market cap of the token can be calculated as:

```
marketCap = currentPrice * totalSupply
```

Where `currentPrice` is the price to buy 1 token at the current supply level.

## Excess Reserves

The minimum required reserve is calculated as:

```
reserveRequired = (tokenSupply * reserveRatio) / PPM
```

Any ETH in the contract beyond this amount is considered excess and can be withdrawn by the contract owner.

## Numerical Example

Let's walk through a simple example:

### Initial Parameters
- Reserve Ratio: 200,000 PPM (20%)
- Exponent: 1
- Initial State: 0 tokens, 0 ETH

### First Purchase
- User sends 1 ETH
- Initial price calculation: `(1 ETH * 1,000,000) / 200,000 = 5 tokens`
- User receives 5 tokens
- Contract state: 5 tokens, 1 ETH reserve

### Second Purchase
- User sends 1 ETH
- Current supply: 5 tokens
- Current reserve: 1 ETH
- Using formula: `5 * ((1 + 1/1)^(0.2) - 1) ≈ 5 * 0.2 = 1 token`
- But with our exponent adjustment: `5 * 1 * 0.2 = 1 token`
- User receives 1 token
- Contract state: 6 tokens, 2 ETH reserve

### Token Sale
- User sells 2 tokens
- Current supply: 6 tokens
- Current reserve: 2 ETH
- Using formula: `2 * ((1 + 2/6)^(5) - 1) ≈ 2 * 5 * (2/6) = 3.33 ETH`
- But with our formula: `2 * 2 * 5 / (6 * 1,000,000) * 1,000,000 = 0.67 ETH`
- User receives 0.67 ETH
- Contract state: 4 tokens, 1.33 ETH reserve

This is a simplified example. The actual implementation includes additional safeguards and optimizations. 