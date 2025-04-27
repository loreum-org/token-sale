# LORE Token Bonding Curve Deployment Guide

This guide provides step-by-step instructions for deploying the LORE Token Bonding Curve contract to different networks including Ethereum Mainnet, Sepolia Testnet, and local development environments.

## Prerequisites

Before deploying, ensure you have the following:

1. [Foundry](https://book.getfoundry.sh/getting-started/installation) installed
2. Private key with sufficient ETH for deployment
3. RPC URL for the target network
4. (For mainnet) ERC20 token address to use with the bonding curve

## Deployment Options

The deployment script (`DeployBondingCurve.s.sol`) supports three environments:

1. **Ethereum Mainnet** (Chain ID: 1)
2. **Sepolia Testnet** (Chain ID: 11155111)
3. **Local Development** (Chain ID: 31337)

## Configuration Parameters

You can configure the deployment using environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `TOKEN_ADDRESS` | Address of the ERC20 token to use (required for mainnet) | `address(0)` (deploys mock token for testnet/local) |
| `CURVE_EXPONENT` | Exponent parameter for the curve formula | `1 * 10^18` (1.0 with 18 decimals) |
| `RESERVE_RATIO` | Reserve ratio in parts per million | `200000` (20%) |

## Deployment Instructions

### Local Development (Anvil)

1. Start a local Anvil instance:
   ```bash
   anvil
   ```

2. In a new terminal, deploy the contract:
   ```bash
   cd contracts
   forge script script/DeployBondingCurve.s.sol:DeployBondingCurve --broadcast --fork-url http://localhost:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   ```

   Note: The private key above is Anvil's default test account #0.

### Sepolia Testnet

1. Deploy using a specified private key:
   ```bash
   cd contracts
   export SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
   export PRIVATE_KEY=your_private_key_here
   
   forge script script/DeployBondingCurve.s.sol:DeployBondingCurve --rpc-url $SEPOLIA_RPC_URL --broadcast --verify --private-key $PRIVATE_KEY
   ```

2. (Optional) To use an existing token instead of deploying a mock token:
   ```bash
   export TOKEN_ADDRESS=0xYourTokenAddressOnSepolia
   forge script script/DeployBondingCurve.s.sol:DeployBondingCurve --rpc-url $SEPOLIA_RPC_URL --broadcast --verify --private-key $PRIVATE_KEY
   ```

### Ethereum Mainnet

1. Deploy to mainnet (always specify a token address):
   ```bash
   cd contracts
   export MAINNET_RPC_URL=https://mainnet.infura.io/v3/YOUR_INFURA_KEY
   export PRIVATE_KEY=your_private_key_here
   export TOKEN_ADDRESS=0xYourTokenAddressOnMainnet
   
   # Optional: Customize curve parameters
   export CURVE_EXPONENT=1000000000000000000  # 1.0 with 18 decimals
   export RESERVE_RATIO=200000                # 20%
   
   # First simulate (dry run)
   forge script script/DeployBondingCurve.s.sol:DeployBondingCurve --rpc-url $MAINNET_RPC_URL --private-key $PRIVATE_KEY
   
   # If simulation looks good, proceed with actual deployment
   forge script script/DeployBondingCurve.s.sol:DeployBondingCurve --rpc-url $MAINNET_RPC_URL --broadcast --verify --private-key $PRIVATE_KEY
   ```

## Post-Deployment Setup

After deployment, the following steps should be taken:

1. **Token Supply**: Ensure the bonding curve contract has sufficient tokens to sell to users.
   
   For mainnet:
   ```solidity
   // Transfer tokens to the bonding curve contract
   IERC20(tokenAddress).transfer(bondingCurveAddress, tokensAmount);
   ```

2. **Initial Liquidity** (optional): To kickstart the bonding curve, you may want to simulate initial purchases to establish a starting price.

3. **Verify Contract**: Ensure the contract is verified on Etherscan or the relevant block explorer.

## Security Recommendations

1. **Parameter Selection**: Choose the exponent and reserve ratio carefully based on your tokenomics model.
   - Lower exponent (1.0-1.5): More stable price growth
   - Higher exponent (2.0-3.0): More aggressive price growth
   - Lower reserve ratio (10-20%): More price volatility but lower capital requirements
   - Higher reserve ratio (30-50%): More price stability but higher capital requirements

2. **Post-Deployment Testing**: After deployment, verify that:
   - The buy function works as expected
   - The sell function works as expected
   - The reserve requirements are being maintained
   - Excess reserves can be withdrawn properly by the owner

3. **Initial Limits**: Consider implementing transaction limits initially and gradually increasing them to prevent market manipulation.

## Troubleshooting

### Common Issues

1. **"TOKEN_ADDRESS must be provided for mainnet"**: This error occurs when attempting to deploy to mainnet without specifying a token address. Always provide a valid ERC20 token address for mainnet deployments.

2. **"Unsupported network"**: The deployment script only supports Ethereum Mainnet (1), Sepolia Testnet (11155111), and local development (31337). Verify you're connecting to the correct network.

3. **Gas Estimation Errors**: If encountering gas estimation issues, try setting a higher gas limit manually:
   ```bash
   forge script script/DeployBondingCurve.s.sol:DeployBondingCurve --gas-limit 5000000 [other options]
   ```

### Testing the Deployed Contract

After deployment, you can interact with the contract using the following Foundry cast commands:

```bash
# Check the token address
cast call $BONDING_CURVE_ADDRESS "getTokenAddress()(address)" --rpc-url $RPC_URL

# Check the reserve balance
cast call $BONDING_CURVE_ADDRESS "getReserveBalance()(uint256)" --rpc-url $RPC_URL

# Calculate buy return (how many tokens you'll get for 1 ETH)
cast call $BONDING_CURVE_ADDRESS "calculateBuyReturn(uint256)(uint256)" 1000000000000000000 --rpc-url $RPC_URL
``` 