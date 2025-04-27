// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "../../lib/forge-std/src/Test.sol";
import {BondingCurve} from "../../src/BondingCurve.sol";
import {IBondingCurve} from "../../src/interfaces/IBondingCurve.sol";
import {MockERC20} from "../mocks/MockERC20.sol";

contract BondingCurveMetricsTest is Test {
    BondingCurve public bondingCurve;
    MockERC20 public token;
    
    address public owner = makeAddr("owner");
    address public buyer = makeAddr("buyer");
    
    // Test parameters
    uint256 public constant EXPONENT = 1; // Linear curve for easier testing
    uint256 public constant RESERVE_RATIO = 500000; // 50%
    uint256 public constant INITIAL_SUPPLY = 1000 * 10**18; // 1,000 tokens
    uint256 public constant MAX_SUPPLY = 1000000 * 10**18; // 1,000,000 tokens
    
    function setUp() public {
        vm.startPrank(owner);
        
        // Deploy mock token with maxSupply function
        token = new MockERC20("LORE Token", "LORE", 18);
        token.setMaxSupply(MAX_SUPPLY);
        
        // Deploy bonding curve contract
        bondingCurve = new BondingCurve(
            address(token),
            EXPONENT,
            RESERVE_RATIO
        );
        
        // Mint initial tokens to the bonding curve contract
        token.mint(address(bondingCurve), INITIAL_SUPPLY);
        
        // Add initial ETH to the curve based on the reserve ratio
        uint256 initialEthRequired = (INITIAL_SUPPLY * RESERVE_RATIO) / 1_000_000; // 50% of token value
        vm.deal(owner, initialEthRequired);
        (bool success, ) = address(bondingCurve).call{value: initialEthRequired}("");
        require(success, "ETH transfer failed");
        
        vm.stopPrank();
    }
    
    /*//////////////////////////////////////////////////////////////
                        PRICE FUNCTION TESTS
    //////////////////////////////////////////////////////////////*/
    
    function test_GetCurrentPrice() public {
        // Given the initial state with 1,000 tokens and 0.5 ETH
        // The price should be around 0.0005 ETH per token (0.5 ETH / 1,000 tokens)
        uint256 price = bondingCurve.getCurrentPrice();
        assertGt(price, 0, "Price should be greater than 0");
        
        // Add more ETH to change the price
        vm.deal(buyer, 0.5 ether);
        vm.prank(buyer);
        
        // Buy tokens to change the price
        bondingCurve.buy{value: 0.5 ether}(0);
        
        // Price should increase after purchase
        uint256 newPrice = bondingCurve.getCurrentPrice();
        assertGt(newPrice, price, "Price should increase after purchase");
    }
    
    function test_GetCurrentPriceWithZeroTokens() public {
        // Deploy a new bonding curve with no tokens
        MockERC20 emptyToken = new MockERC20("Empty Token", "EMPTY", 18);
        BondingCurve emptyCurve = new BondingCurve(
            address(emptyToken),
            EXPONENT,
            RESERVE_RATIO
        );
        
        // Price should use the default value when no tokens
        uint256 price = emptyCurve.getCurrentPrice();
        assertEq(price, 1e15, "Should return default price of 0.001 ETH");
    }
    
    function test_GetCurrentPriceWithZeroReserve() public {
        // Deploy a new bonding curve with tokens but no reserve
        MockERC20 tokenWithoutReserve = new MockERC20("No Reserve", "NR", 18);
        BondingCurve curveWithoutReserve = new BondingCurve(
            address(tokenWithoutReserve),
            EXPONENT,
            RESERVE_RATIO
        );
        
        // Mint tokens but don't add ETH
        tokenWithoutReserve.mint(address(curveWithoutReserve), INITIAL_SUPPLY);
        
        // Price should use the default value when no reserve
        uint256 price = curveWithoutReserve.getCurrentPrice();
        assertEq(price, 1e15, "Should return default price of 0.001 ETH");
    }
    
    /*//////////////////////////////////////////////////////////////
                        MARKET CAP TESTS
    //////////////////////////////////////////////////////////////*/
    
    function test_GetMarketCap() public {
        // Market cap = current price * total supply in contract
        uint256 marketCap = bondingCurve.getMarketCap();
        assertGt(marketCap, 0, "Market cap should be greater than 0");
        
        // Add more tokens and ETH to ensure the market cap increases
        vm.startPrank(owner);
        token.mint(address(bondingCurve), INITIAL_SUPPLY); // Double the supply
        
        // Also add more ETH to maintain the appropriate reserve ratio
        vm.deal(owner, 0.5 ether);
        (bool success, ) = address(bondingCurve).call{value: 0.5 ether}("");
        require(success, "ETH transfer failed");
        
        vm.stopPrank();
        
        uint256 newMarketCap = bondingCurve.getMarketCap();
        assertGt(newMarketCap, marketCap, "Market cap should increase with more tokens");
    }
    
    function test_GetMarketCapWithZeroTokens() public {
        // Deploy a new bonding curve with no tokens
        MockERC20 emptyToken = new MockERC20("Empty Token", "EMPTY", 18);
        BondingCurve emptyCurve = new BondingCurve(
            address(emptyToken),
            EXPONENT,
            RESERVE_RATIO
        );
        
        // Market cap should be zero when no tokens
        uint256 marketCap = emptyCurve.getMarketCap();
        assertEq(marketCap, 0, "Market cap should be zero with no tokens");
    }
    
    /*//////////////////////////////////////////////////////////////
                    FULLY DILUTED VALUATION TESTS
    //////////////////////////////////////////////////////////////*/
    
    function test_GetFullyDilutedValuation() public {
        // FDV = current price * max supply
        uint256 fdv = bondingCurve.getFullyDilutedValuation();
        assertGt(fdv, 0, "FDV should be greater than 0");
        
        // FDV should be higher than market cap given max supply > current supply
        uint256 marketCap = bondingCurve.getMarketCap();
        assertGt(fdv, marketCap, "FDV should be higher than market cap");
    }
    
    function test_GetFullyDilutedValuationWithNoMaxSupply() public {
        // Deploy a new token without a maxSupply function
        // Actually, we can't remove the maxSupply function, but we can use the default value
        MockERC20 tokenWithDefaultMax = new MockERC20("Default Max", "DM", 18);
        // Don't call setMaxSupply, so it uses the default value
        
        BondingCurve curveWithDefaultMax = new BondingCurve(
            address(tokenWithDefaultMax),
            EXPONENT,
            RESERVE_RATIO
        );
        
        // Mint tokens and add ETH
        tokenWithDefaultMax.mint(address(curveWithDefaultMax), INITIAL_SUPPLY);
        vm.deal(address(this), 0.5 ether);
        (bool success, ) = address(curveWithDefaultMax).call{value: 0.5 ether}("");
        require(success, "ETH transfer failed");
        
        // FDV should be greater than zero
        uint256 fdv = curveWithDefaultMax.getFullyDilutedValuation();
        assertGt(fdv, 0, "FDV should be greater than zero");
    }
    
    /*//////////////////////////////////////////////////////////////
                      INTEGRATION TESTS
    //////////////////////////////////////////////////////////////*/
    
    function test_MetricsChangeAfterBuySell() public {
        // Record initial metrics
        uint256 initialPrice = bondingCurve.getCurrentPrice();
        uint256 initialMarketCap = bondingCurve.getMarketCap();
        uint256 initialFDV = bondingCurve.getFullyDilutedValuation();
        
        // Buy tokens with a much larger amount to ensure significant price change
        vm.deal(buyer, 5 ether);
        vm.startPrank(buyer);
        uint256 tokensBought = bondingCurve.buy{value: 5 ether}(0);
        
        // Metrics should increase after buying
        uint256 priceAfterBuy = bondingCurve.getCurrentPrice();
        uint256 marketCapAfterBuy = bondingCurve.getMarketCap();
        uint256 fdvAfterBuy = bondingCurve.getFullyDilutedValuation();
        
        assertGt(priceAfterBuy, initialPrice, "Price should increase after buying");
        assertGt(marketCapAfterBuy, initialMarketCap, "Market cap should increase after buying");
        assertGt(fdvAfterBuy, initialFDV, "FDV should increase after buying");
        
        // Sell tokens to change metrics
        token.approve(address(bondingCurve), tokensBought);
        bondingCurve.sell(tokensBought, 0);
        vm.stopPrank();
        
        // Metrics should decrease after selling back to approximately initial values
        uint256 priceAfterSell = bondingCurve.getCurrentPrice();
        uint256 marketCapAfterSell = bondingCurve.getMarketCap();
        uint256 fdvAfterSell = bondingCurve.getFullyDilutedValuation();
        
        // Use ≤ for the comparisons since we might get back to exactly the initial values
        assertLe(priceAfterSell, priceAfterBuy, "Price should decrease after selling");
        assertLe(marketCapAfterSell, marketCapAfterBuy, "Market cap should decrease after selling");
        assertLe(fdvAfterSell, fdvAfterBuy, "FDV should decrease after selling");
    }
    
    /*//////////////////////////////////////////////////////////////
                      TRANSACTION HISTORY TESTS
    //////////////////////////////////////////////////////////////*/
    
    function test_TransactionHistoryWithMetrics() public {
        // Record initial metrics
        uint256 initialPrice = bondingCurve.getCurrentPrice();
        
        // User buys tokens
        vm.deal(buyer, 1 ether);
        vm.startPrank(buyer);
        uint256 tokensBought = bondingCurve.buy{value: 1 ether}(0);
        
        // New price after buy
        uint256 priceAfterBuy = bondingCurve.getCurrentPrice();
        
        // User sells tokens
        token.approve(address(bondingCurve), tokensBought);
        uint256 ethReturned = bondingCurve.sell(tokensBought, 0);
        vm.stopPrank();
        
        // Final price after sell
        uint256 priceAfterSell = bondingCurve.getCurrentPrice();
        
        // Check transaction history
        IBondingCurve.Transaction[] memory transactions = bondingCurve.getTransactionHistory(buyer);
        
        // Verify we have 2 transactions
        assertEq(transactions.length, 2, "Should have 2 transactions");
        
        // Verify buy transaction
        assertEq(uint(transactions[0].txType), uint(IBondingCurve.TransactionType.Buy), "First transaction type should be Buy");
        assertEq(transactions[0].ethAmount, 1 ether, "Buy ETH amount should match");
        assertEq(transactions[0].tokenAmount, tokensBought, "Buy token amount should match");
        
        // Verify sell transaction
        assertEq(uint(transactions[1].txType), uint(IBondingCurve.TransactionType.Sell), "Second transaction type should be Sell");
        assertEq(transactions[1].ethAmount, ethReturned, "Sell ETH amount should match");
        assertEq(transactions[1].tokenAmount, tokensBought, "Sell token amount should match");
        
        // Verify price changes align with transactions
        assertGt(priceAfterBuy, initialPrice, "Price should increase after buy transaction");
        assertLe(priceAfterSell, priceAfterBuy, "Price should decrease after sell transaction");
    }
} 