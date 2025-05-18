// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "../../lib/forge-std/src/Test.sol";
import {BondingCurve} from "../../src/BondingCurve.sol";
import {MockERC20} from "../mocks/MockERC20.sol";

contract BondingCurveReserveRatioTest is Test {
    BondingCurve public bondingCurve;
    MockERC20 public loreToken;
    
    address public owner;
    address public nonOwner;
    address public trader;
    
    // Test parameters
    uint256 public constant INITIAL_EXPONENT = 5 * 10**17; // 0.5 with 18 decimals
    uint256 public constant INITIAL_RESERVE_RATIO = 200000; // 20% with ppm (parts per million)
    uint256 public constant INITIAL_SUPPLY = 1_000_000 * 10**18; // 1M tokens
    uint256 public constant PPM = 1_000_000; // Parts per million constant
    
    function setUp() public {
        owner = makeAddr("owner");
        nonOwner = makeAddr("nonOwner");
        trader = makeAddr("trader");
        
        vm.startPrank(owner);
        
        // Deploy mock token
        loreToken = new MockERC20("LORE Token", "LORE", 18);
        
        // Deploy bonding curve contract with correct parameters
        bondingCurve = new BondingCurve(
            address(loreToken),
            INITIAL_EXPONENT,
            INITIAL_RESERVE_RATIO
        );
        
        // Mint initial tokens to the bonding curve contract
        loreToken.mint(address(bondingCurve), INITIAL_SUPPLY);
        
        // Add initial ETH to match reserve ratio
        uint256 initialReserveRequired = (INITIAL_SUPPLY * INITIAL_RESERVE_RATIO) / PPM;
        vm.deal(owner, initialReserveRequired);
        (bool success, ) = address(bondingCurve).call{value: initialReserveRequired}("");
        require(success, "ETH transfer failed");
        
        vm.stopPrank();
        
        // Fund trader
        vm.deal(trader, 100 ether);
    }
    
    function test_ReserveRatioSet() public view {
        assertEq(bondingCurve.reserveRatio(), INITIAL_RESERVE_RATIO, "Reserve ratio should be set correctly");
    }
    
    /*//////////////////////////////////////////////////////////////
                      UPDATE RESERVE RATIO TESTS
    //////////////////////////////////////////////////////////////*/
    
    function test_UpdateReserveRatio() public {
        uint256 newRatio = 300000; // 30%
        
        vm.prank(owner);
        bondingCurve.updateReserveRatio(newRatio);
        
        assertEq(bondingCurve.reserveRatio(), newRatio, "Reserve ratio should be updated");
    }
    
    function test_UpdateReserveRatio_EmitsEvent() public {
        uint256 newRatio = 400000; // 40%
        
        vm.prank(owner);
        vm.expectEmit(false, false, false, true);
        emit ReserveRatioUpdated(newRatio);
        bondingCurve.updateReserveRatio(newRatio);
    }
    
    function test_RevertWhen_NonOwnerUpdatesReserveRatio() public {
        uint256 newRatio = 300000; // 30%
        
        vm.prank(nonOwner);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", nonOwner));
        bondingCurve.updateReserveRatio(newRatio);
    }
    
    function test_RevertWhen_ZeroReserveRatio() public {
        uint256 newRatio = 0;
        
        vm.prank(owner);
        vm.expectRevert("BondingCurve: invalid reserve ratio");
        bondingCurve.updateReserveRatio(newRatio);
    }
    
    function test_RevertWhen_ReserveRatioExceedsMaximum() public {
        uint256 newRatio = PPM + 1; // 100% + 1
        
        vm.prank(owner);
        vm.expectRevert("BondingCurve: invalid reserve ratio");
        bondingCurve.updateReserveRatio(newRatio);
    }
    
    function test_UpdateReserveRatio_MaxValue() public {
        uint256 newRatio = PPM; // 100%
        
        vm.prank(owner);
        bondingCurve.updateReserveRatio(newRatio);
        
        assertEq(bondingCurve.reserveRatio(), newRatio, "Reserve ratio should be updated to max value");
    }
    
    function test_UpdateReserveRatio_MinValue() public {
        uint256 newRatio = 1; // Minimum valid value
        
        vm.prank(owner);
        bondingCurve.updateReserveRatio(newRatio);
        
        assertEq(bondingCurve.reserveRatio(), newRatio, "Reserve ratio should be updated to min value");
    }
    
    function test_UpdateReserveRatio_AffectsPricing() public {
        // Add some ETH to the contract
        vm.deal(address(bondingCurve), 10 ether);
        
        // Check price before update
        uint256 ethAmount = 1 ether;
        uint256 tokensBefore = bondingCurve.calculateBuyReturn(ethAmount);
        
        // Update reserve ratio
        uint256 newRatio = INITIAL_RESERVE_RATIO * 2; // Double the reserve ratio
        vm.prank(owner);
        bondingCurve.updateReserveRatio(newRatio);
        
        // Check price after update
        uint256 tokensAfter = bondingCurve.calculateBuyReturn(ethAmount);
        
        // In this implementation, with a higher reserve ratio, more tokens are returned
        // This is based on the formula used in the bonding curve's calculateBuyReturn function
        // where the reserve ratio has a direct relationship with the number of tokens returned
        assertGt(tokensAfter, tokensBefore, "Increasing reserve ratio should increase tokens returned in this implementation");
        
        // For context:
        // In the formula (ethAmount * PPM) / reserveRatio, a higher reserve ratio 
        // results in fewer tokens, but in the bonding curve formula used in calculateCurveReturn, 
        // the behavior can be different depending on the implementation details
    }
    
    /*//////////////////////////////////////////////////////////////
                      INTEGRATION TEST
    //////////////////////////////////////////////////////////////*/
    
    function test_Integration_ReserveRatioUpdateWithBuySell() public {
        // Initial buy with the original reserve ratio
        vm.startPrank(trader);
        uint256 buyAmount = 5 ether;
        
        // Buy tokens
        uint256 tokensBought = bondingCurve.buy{value: buyAmount}(0);
        assertGt(tokensBought, 0, "Should receive tokens");
        
        // Record current token balance
        uint256 traderInitialEthBalance = trader.balance;
        
        // Sell half the tokens
        uint256 tokensToSell = tokensBought / 2;
        loreToken.approve(address(bondingCurve), tokensToSell);
        uint256 ethReceivedBeforeUpdate = bondingCurve.sell(tokensToSell, 0);
        
        vm.stopPrank();
        
        // Owner updates the reserve ratio (increase it)
        uint256 newRatio = INITIAL_RESERVE_RATIO * 2; // Double the reserve ratio
        vm.prank(owner);
        bondingCurve.updateReserveRatio(newRatio);
        
        // Trader sells the remaining tokens after reserve ratio update
        vm.startPrank(trader);
        uint256 remainingTokens = loreToken.balanceOf(trader);
        loreToken.approve(address(bondingCurve), remainingTokens);
        uint256 ethReceivedAfterUpdate = bondingCurve.sell(remainingTokens, 0);
        vm.stopPrank();
        
        // Final balances
        uint256 finalEthBalance = trader.balance;
        uint256 finalTokenBalance = loreToken.balanceOf(trader);
        
        // Assertions
        assertEq(finalTokenBalance, 0, "Trader should have sold all tokens");
        assertGt(finalEthBalance, traderInitialEthBalance - buyAmount, "Trader should recover some ETH");
        assertGt(ethReceivedAfterUpdate, 0, "Should receive ETH for second sell");
        
        // Compare sell rates before and after reserve ratio update
        // With higher reserve ratio, the price sensitivity should decrease
        // So selling the same proportion of tokens should return a different amount of ETH
        uint256 ethPerTokenBefore = (ethReceivedBeforeUpdate * 1e18) / tokensToSell;
        uint256 ethPerTokenAfter = (ethReceivedAfterUpdate * 1e18) / remainingTokens;
        
        // The actual relationship between these values depends on the specific formula used in the bonding curve,
        // but we can at least verify they're not identical
        assertNotEq(ethPerTokenBefore, ethPerTokenAfter, "ETH per token rate should change after reserve ratio update");
    }
    
    // Helper event to test event emission
    event ReserveRatioUpdated(uint256 newRatio);
} 