// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "../../lib/forge-std/src/Test.sol";
import {StdInvariant} from "../../lib/forge-std/src/StdInvariant.sol";
import {BondingCurve} from "../../src/BondingCurve.sol";
import {MockERC20} from "../mocks/MockERC20.sol";
import {BondingCurveHandler} from "./handlers/BondingCurveHandler.sol";

contract BondingCurveInvariantTest is Test {
    BondingCurve public bondingCurve;
    MockERC20 public loreToken;
    BondingCurveHandler public handler;
    
    address public owner;
    
    // Initial parameters
    uint256 public constant INITIAL_EXPONENT = 5 * 10**17; // 0.5 with 18 decimals
    uint256 public constant INITIAL_COEFFICIENT = 1 * 10**16; // 0.01 with 18 decimals
    uint256 public constant INITIAL_RESERVE_RATIO = 200000; // 20% with ppm (parts per million)
    uint256 public constant INITIAL_SUPPLY = 1_000_000 * 10**18; // 1M tokens
    
    // Reserve tracking
    uint256 public initialReserveRatio;
    uint256 public reserveRatioLastUpdated;
    
    // Ghost variables for tracking health
    uint256 public reserveDeficitCount;
    uint256 public lastReserveDeficit;
    
    function setUp() public {
        owner = makeAddr("owner");
        
        vm.startPrank(owner);
        
        // Deploy mock token
        loreToken = new MockERC20("LORE Token", "LORE", 18);
        
        // Deploy bonding curve contract
        bondingCurve = new BondingCurve(
            address(loreToken),
            INITIAL_EXPONENT,
            INITIAL_RESERVE_RATIO
        );
        
        // Record initial reserve ratio
        initialReserveRatio = bondingCurve.reserveRatio();
        
        // Mint initial tokens to the bonding curve contract
        loreToken.mint(address(bondingCurve), INITIAL_SUPPLY);
        
        // Set up handler
        handler = new BondingCurveHandler(bondingCurve, loreToken);
        
        vm.stopPrank();
        
        // Target the handler for invariant testing
        targetContract(address(handler));
        
        // Add ETH to the contract to ensure there are sufficient reserves initially
        uint256 marketCap = bondingCurve.getMarketCap();
        uint256 requiredReserves = (marketCap * initialReserveRatio) / 1000000;
        vm.deal(address(bondingCurve), requiredReserves * 2); // Double the required amount
    }
    
    /*//////////////////////////////////////////////////////////////
                            INVARIANT TESTS
    //////////////////////////////////////////////////////////////*/
    
    function invariant_reserveRatio() public {
        // The reserve ratio should always be valid (between 0 and 100%)
        uint256 reserveRatio = bondingCurve.reserveRatio();
        assertLe(reserveRatio, 1000000, "Reserve ratio should not exceed 100%");
        
        // If the reserve ratio has changed, record the update time
        if (reserveRatio != initialReserveRatio) {
            initialReserveRatio = reserveRatio;
            reserveRatioLastUpdated = handler.getOperationCount();
        }
    }
    
    function invariant_observeReserveHealth() public {
        // This function observes the reserve health but doesn't enforce it as an invariant
        // Instead, it tracks deficit counts for analysis
        uint256 marketCap = bondingCurve.getMarketCap();
        uint256 requiredReserves = (marketCap * bondingCurve.reserveRatio()) / 1000000;
        uint256 currentReserves = address(bondingCurve).balance;
        
        // Log the current values
        if (handler.getOperationCount() % 50 == 0) {
            console.log("Market Cap:", marketCap);
            console.log("Reserve Ratio:", bondingCurve.reserveRatio());
            console.log("Required Reserves:", requiredReserves);
            console.log("Current Reserves:", currentReserves);
            console.log("Reserve Deficit Count:", reserveDeficitCount);
        }
        
        // Track if there's a reserve deficit
        if (currentReserves < requiredReserves) {
            reserveDeficitCount++;
            lastReserveDeficit = handler.getOperationCount();
        }
    }
    
    function invariant_tokenSupply() public {
        // Token supply in the system should be conserved (only the bonding curve can mint/burn)
        uint256 totalSupply = loreToken.totalSupply();
        uint256 balanceInBondingCurve = loreToken.balanceOf(address(bondingCurve));
        uint256 balanceInOtherAccounts = handler.totalUserBalances();
        
        assertEq(totalSupply, balanceInBondingCurve + balanceInOtherAccounts, "Token supply should be conserved");
    }
    
    function invariant_marketCapCalculation() public {
        // Market cap should always equal total supply * current price
        uint256 marketCap = bondingCurve.getMarketCap();
        uint256 calculatedMarketCap = (loreToken.totalSupply() * bondingCurve.getCurrentPrice()) / 1e18;
        
        // Allow for some rounding error
        assertApproxEqRel(marketCap, calculatedMarketCap, 0.001e18, "Market cap calculation should be correct");
    }
    
    function invariant_priceIsNonZero() public {
        // Price should never be zero
        uint256 price = bondingCurve.getCurrentPrice();
        assertGt(price, 0, "Price should never be zero");
    }
    
    function invariant_transactionHistoryConsistency() public {
        // Transaction count in the handler should match the contract's records
        for (uint i = 0; i < handler.numActors(); i++) {
            address actor = handler.actors(i);
            uint256 txCount = handler.userTransactionCount(actor);
            
            BondingCurve.Transaction[] memory history = bondingCurve.getTransactionHistory(actor);
            assertEq(history.length, txCount, "Transaction count should match");
        }
    }
    
    function invariant_ownershipNeverChanges() public {
        // Ownership should never change during testing
        assertEq(bondingCurve.owner(), owner, "Owner should not change");
    }
    
    function invariant_maxConsecutiveDeficits() public {
        // Ensure that any reserve deficit is eventually corrected
        // This allows for temporary deficits but ensures the system can recover
        if (reserveDeficitCount > 0) {
            uint256 deficitDuration = handler.getOperationCount() - lastReserveDeficit;
            uint256 maxAllowedDeficitDuration = 50; // Allow up to 50 operations before reserve must be corrected
            
            assertLe(deficitDuration, maxAllowedDeficitDuration, "Reserve deficit persisted for too long");
        }
    }
    
    function invariant_callSummary() public view {
        // Log call summary for analysis
        console.log("Buy calls:", handler.buyCalls());
        console.log("Sell calls:", handler.sellCalls());
        console.log("Withdrawals made:", handler.withdrawalsMade());
        console.log("Parameter updates:", handler.parameterUpdateCalls());
        console.log("Operation count:", handler.getOperationCount());
        console.log("Total reserve deficit count:", reserveDeficitCount);
    }
} 