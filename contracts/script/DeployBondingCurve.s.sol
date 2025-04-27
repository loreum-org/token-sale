// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../lib/forge-std/src/Script.sol";
import "../src/BondingCurve.sol";
import "../test/mocks/MockERC20.sol";

/**
 * @title DeployBondingCurve
 * @dev Script to deploy the BondingCurve contract and (optionally) a mock token
 * for testing on various networks including mainnet, testnet, and localhost
 */
contract DeployBondingCurve is Script {
    // Default values if not overridden via environment variables
    uint256 constant DEFAULT_EXPONENT = 1 * 10**18;      // 1.0 (using 18 decimals)
    uint256 constant DEFAULT_RESERVE_RATIO = 200000;     // 20% (in parts per million)
    
    function run() public returns (BondingCurve bondingCurve, address tokenAddress) {
        // Get chain ID to determine network
        uint256 chainId = block.chainid;
        
        // Get configuration from environment variables or use defaults
        uint256 exponent = vm.envOr("CURVE_EXPONENT", DEFAULT_EXPONENT);
        uint256 reserveRatio = vm.envOr("RESERVE_RATIO", DEFAULT_RESERVE_RATIO);
        
        // Handle token address depending on the network
        address deployedTokenAddress;
        
        if (chainId == 1) {
            // Ethereum Mainnet - should use a real token address
            deployedTokenAddress = vm.envOr("TOKEN_ADDRESS", address(0));
            require(deployedTokenAddress != address(0), "TOKEN_ADDRESS must be provided for mainnet");
        } else if (chainId == 11155111) {
            // Sepolia Testnet
            deployedTokenAddress = vm.envOr("TOKEN_ADDRESS", address(0));
            
            // If no token address is provided, deploy a mock token
            if (deployedTokenAddress == address(0)) {
                vm.startBroadcast();
                MockERC20 mockToken = new MockERC20("LORE Token", "LORE", 18);
                deployedTokenAddress = address(mockToken);
                vm.stopBroadcast();
                
                console.log("Deployed mock LORE token on Sepolia at:", deployedTokenAddress);
            }
        } else if (chainId == 31337) {
            // Local network (Anvil/Hardhat)
            deployedTokenAddress = vm.envOr("TOKEN_ADDRESS", address(0));
            
            // For local development, always deploy a fresh mock token if none provided
            if (deployedTokenAddress == address(0)) {
                vm.startBroadcast();
                MockERC20 mockToken = new MockERC20("LORE Token", "LORE", 18);
                // Mint some tokens to the deployer for testing
                mockToken.mint(msg.sender, 1000000 * 10**18); // 1M tokens
                deployedTokenAddress = address(mockToken);
                vm.stopBroadcast();
                
                console.log("Deployed mock LORE token locally at:", deployedTokenAddress);
            }
        } else {
            revert("Unsupported network");
        }
        
        // Deploy the BondingCurve contract
        vm.startBroadcast();
        bondingCurve = new BondingCurve(
            deployedTokenAddress,
            exponent,
            reserveRatio
        );
        vm.stopBroadcast();
        
        // Log deployment info
        console.log("Deployed BondingCurve at:", address(bondingCurve));
        console.log("Token address:", deployedTokenAddress);
        console.log("Exponent:", exponent);
        console.log("Reserve ratio:", reserveRatio);
        
        // If this is a local development environment, set up the bonding curve with tokens
        if (chainId == 31337) {
            vm.startBroadcast();
            MockERC20(deployedTokenAddress).mint(address(bondingCurve), 1000000 * 10**18); // 1M tokens
            vm.stopBroadcast();
            console.log("Minted 1,000,000 LORE tokens to the bonding curve for testing");
        }
        
        // Return the deployed contract and token address
        return (bondingCurve, deployedTokenAddress);
    }
} 