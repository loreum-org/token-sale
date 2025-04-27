// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "../../lib/forge-std/src/Test.sol";
import {BondingCurve} from "../../src/BondingCurve.sol";
import {MockERC20} from "../mocks/MockERC20.sol";

contract BondingCurveReserveRatioTest is Test {
    BondingCurve public bondingCurve;
    MockERC20 public loreToken;
    
    address public owner;
    
    // Test parameters
    uint256 public constant INITIAL_EXPONENT = 5 * 10**17; // 0.5 with 18 decimals
    uint256 public constant INITIAL_RESERVE_RATIO = 200000; // 20% with ppm (parts per million)
    uint256 public constant INITIAL_SUPPLY = 1_000_000 * 10**18; // 1M tokens
    
    function setUp() public {
        owner = makeAddr("owner");
        
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
        
        vm.stopPrank();
    }
    
    function test_ReserveRatioSet() public {
        assertEq(bondingCurve.reserveRatio(), INITIAL_RESERVE_RATIO, "Reserve ratio should be set correctly");
    }
} 