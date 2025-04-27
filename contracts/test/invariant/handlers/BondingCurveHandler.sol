// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "../../../lib/forge-std/src/Test.sol";
import {BondingCurve} from "../../../src/BondingCurve.sol";
import {MockERC20} from "../../mocks/MockERC20.sol";

/**
 * @title BondingCurveHandler
 * @dev Handler contract for performing actions on the bonding curve during invariant testing
 */
contract BondingCurveHandler is Test {
    BondingCurve public bondingCurve;
    MockERC20 public loreToken;
    
    // Actor management
    address[] public actors;
    mapping(address => uint256) public userBuyCount;
    mapping(address => uint256) public userSellCount;
    
    // Call counters
    uint256 public buyCalls;
    uint256 public sellCalls;
    uint256 public withdrawalsMade;
    uint256 public parameterUpdateCalls;
    uint256 public operationCount;
    
    // Max amounts
    uint256 public constant MAX_BUY_AMOUNT = 100 ether;
    uint256 public constant MAX_ACTORS = 10;
    
    constructor(BondingCurve _bondingCurve, MockERC20 _loreToken) {
        bondingCurve = _bondingCurve;
        loreToken = _loreToken;
    }
    
    /**
     * @dev Creates a new actor or returns an existing one
     */
    function getActor(uint256 actorSeed) public returns (address) {
        operationCount++;
        
        if (actors.length == 0 || (actorSeed % 3 == 0 && actors.length < MAX_ACTORS)) {
            // Create new actor
            address newActor = makeAddr(string(abi.encodePacked("actor", actors.length)));
            actors.push(newActor);
            return newActor;
        } else {
            // Use existing actor
            return actors[actorSeed % actors.length];
        }
    }
    
    /**
     * @dev Buy tokens from the bonding curve
     */
    function buy(uint256 actorSeed, uint256 ethAmount) public {
        operationCount++;
        
        // Bound eth amount to avoid extremely large values
        ethAmount = bound(ethAmount, 0.001 ether, MAX_BUY_AMOUNT);
        if (ethAmount == 0) return;
        
        address actor = getActor(actorSeed);
        
        // Fund the actor
        vm.deal(actor, ethAmount);
        
        vm.startPrank(actor);
        
        // Calculate minimum tokens to expect (with 2% slippage tolerance)
        uint256 expectedTokens = bondingCurve.calculateBuyReturn(ethAmount);
        uint256 minTokens = (expectedTokens * 98) / 100; // 2% slippage allowed
        
        // Buy tokens
        try bondingCurve.buy{value: ethAmount}(minTokens) {
            buyCalls++;
            userBuyCount[actor]++;
        } catch {
            // If the call fails (e.g., due to calculation errors), we just ignore it
        }
        
        vm.stopPrank();
    }
    
    /**
     * @dev Sell tokens to the bonding curve
     */
    function sell(uint256 actorSeed, uint256 sellRatio) public {
        operationCount++;
        
        // Bound ratio to be between 1% and 100%
        sellRatio = bound(sellRatio, 1, 100);
        
        address actor = getActor(actorSeed);
        uint256 tokenBalance = loreToken.balanceOf(actor);
        
        // Skip if the actor has no tokens
        if (tokenBalance == 0) return;
        
        // Calculate tokens to sell based on the ratio
        uint256 tokensToSell = (tokenBalance * sellRatio) / 100;
        if (tokensToSell == 0) return;
        
        // Calculate minimum ETH to expect (with 2% slippage tolerance)
        uint256 expectedEth = bondingCurve.calculateSellReturn(tokensToSell);
        uint256 minEth = (expectedEth * 98) / 100; // 2% slippage allowed
        
        vm.startPrank(actor);
        
        // Approve tokens
        loreToken.approve(address(bondingCurve), tokensToSell);
        
        // Sell tokens
        try bondingCurve.sell(tokensToSell, minEth) {
            sellCalls++;
            userSellCount[actor]++;
        } catch {
            // If the call fails, we just ignore it
        }
        
        vm.stopPrank();
    }
    
    /**
     * @dev Update curve parameters (only callable by owner)
     */
    function updateCurveParameters(uint256 newExponentSeed, uint256 newCoefficientSeed) public {
        operationCount++;
        
        // Bound parameters to reasonable values
        uint256 newExponent = bound(newExponentSeed, 1e17, 1e18); // 0.1 to 1.0
        uint256 newCoefficient = bound(newCoefficientSeed, 1e15, 1e17); // 0.001 to 0.1
        
        address owner = bondingCurve.owner();
        
        vm.prank(owner);
        try bondingCurve.updateCurveParameters(newExponent, newCoefficient) {
            parameterUpdateCalls++;
        } catch {
            // If the call fails, we just ignore it
        }
    }
    
    /**
     * @dev Update reserve ratio (only callable by owner)
     */
    function updateReserveRatio(uint256 newRatioSeed) public {
        operationCount++;
        
        // Bound ratio to valid range
        uint256 newRatio = bound(newRatioSeed, 100000, 1000000); // 10% to 100%
        
        address owner = bondingCurve.owner();
        
        vm.prank(owner);
        try bondingCurve.updateReserveRatio(newRatio) {
            parameterUpdateCalls++;
        } catch {
            // If the call fails, we just ignore it
        }
    }
    
    /**
     * @dev Withdraw excess reserves (only callable by owner)
     */
    function withdrawExcessReserves(uint256 withdrawalRatio) public {
        operationCount++;
        
        // Get market cap and calculate required reserves
        uint256 marketCap = bondingCurve.getMarketCap();
        uint256 reserveRatio = bondingCurve.reserveRatio();
        uint256 requiredReserves = (marketCap * reserveRatio) / 1000000;
        uint256 currentReserves = address(bondingCurve).balance;
        
        // Skip if there are no excess reserves
        if (currentReserves <= requiredReserves) return;
        
        uint256 excessReserves = currentReserves - requiredReserves;
        
        // Bound withdrawal ratio
        withdrawalRatio = bound(withdrawalRatio, 1, 100);
        uint256 withdrawAmount = (excessReserves * withdrawalRatio) / 100;
        
        // Skip if the withdrawal amount is too small
        if (withdrawAmount == 0) return;
        
        address owner = bondingCurve.owner();
        
        vm.prank(owner);
        try bondingCurve.withdrawExcessReserves(withdrawAmount) {
            withdrawalsMade++;
        } catch {
            // If the call fails, we just ignore it
        }
    }
    
    /**
     * @dev Return the number of actors
     */
    function numActors() public view returns (uint256) {
        return actors.length;
    }
    
    /**
     * @dev Return the total number of transactions for a user
     */
    function userTransactionCount(address user) public view returns (uint256) {
        return userBuyCount[user] + userSellCount[user];
    }
    
    /**
     * @dev Return the sum of all token balances across users
     */
    function totalUserBalances() public view returns (uint256) {
        uint256 total = 0;
        for (uint i = 0; i < actors.length; i++) {
            total += loreToken.balanceOf(actors[i]);
        }
        return total;
    }
    
    /**
     * @dev Return the total operation count
     */
    function getOperationCount() public view returns (uint256) {
        return operationCount;
    }
} 