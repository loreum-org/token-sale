# LORE Token Bonding Curve

This project demonstrates a token sale mechanism using a polynomial bonding curve for automatic price discovery.

## Components

1. **Bonding Curve Visualization Script**: A Python script that generates visualizations of token price curves with different exponents.
2. **Interactive Web App**: A Next.js application that allows users to simulate buying and selling tokens on the bonding curve.

## Bonding Curve Mechanics

The bonding curve uses a polynomial formula (`x^n`) where:
- `n` is the exponent parameter (typically between 1 and 3)
- The price of tokens increases as more tokens are purchased (convex curve)
- The price decreases as tokens are sold back to the contract

## Getting Started

### Visualization Script

To generate the bonding curve visualization:

1. Set up a Python virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

2. Run the visualization script:
   ```bash
   python scripts/bonding_curve_visualization.py
   ```

This will generate a `bonding_curve.png` file showing different curves with various exponents.

### Web App

The web app provides an interactive simulation of the bonding curve:

1. Navigate to the app directory:
   ```bash
   cd app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Visit http://localhost:3000 in your browser and click on "Try Bonding Curve Simulator"

## Features

- **Curve Visualization**: Interactive chart showing the bonding curve with adjustable exponents
- **Buy/Sell Simulation**: Test how buying and selling affects price and token supply
- **Price Calculations**: See how different transaction amounts impact price slippage
- **Wallet Simulation**: Track your simulated token and ETH balances

## How It Works

1. **Buying Tokens**:
   - User sends ETH to buy tokens
   - Price is calculated based on the current supply and exponent
   - Tokens are added to the user's balance
   - Supply increases

2. **Selling Tokens**:
   - User sells tokens back to the contract 
   - Price is calculated based on the new (reduced) supply
   - ETH is added to the user's balance
   - Supply decreases

## Formulas

- **Token Price**: `price = (supply / max_supply)^n * max_price`
- **Buy Return** (simplified): `tokens = eth_amount / current_price`
- **Sell Return** (simplified): `eth = token_amount * current_price`

In a production implementation, integral calculus would be used to accurately calculate the area under the curve for precise token/ETH amounts.
