// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IBondingCurve
 * @dev Interface for the BondingCurve contract that handles token buying and selling through a polynomial bonding curve
 */
interface IBondingCurve {
    /**
     * @dev Type of transaction (Buy or Sell)
     */
    enum TransactionType { Buy, Sell }
    
    /**
     * @dev Transaction details
     */
    struct Transaction {
        TransactionType txType;
        uint256 ethAmount;
        uint256 tokenAmount;
        uint256 timestamp;
    }
    
    /**
     * @dev Emitted when tokens are purchased
     * @param buyer Address that purchased tokens
     * @param ethAmount Amount of ETH spent
     * @param tokenAmount Amount of tokens received
     */
    event TokensPurchased(address indexed buyer, uint256 ethAmount, uint256 tokenAmount);

    /**
     * @dev Emitted when tokens are sold
     * @param seller Address that sold tokens
     * @param tokenAmount Amount of tokens sold
     * @param ethAmount Amount of ETH received
     */
    event TokensSold(address indexed seller, uint256 tokenAmount, uint256 ethAmount);

    /**
     * @dev Emitted when the contract is paused
     * @param account Address that paused the contract
     */
    event Paused(address account);

    /**
     * @dev Emitted when the contract is unpaused
     * @param account Address that unpaused the contract
     */
    event Unpaused(address account);

    /**
     * @dev Emitted when excess ETH is recovered
     * @param to Address receiving the ETH
     * @param amount Amount of ETH recovered
     */
    event EthRecovered(address indexed to, uint256 amount);

    /**
     * @dev Emitted when ERC20 tokens are recovered
     * @param token Address of the ERC20 token
     * @param to Address receiving the tokens
     * @param amount Amount of tokens recovered
     */
    event ERC20Recovered(address indexed token, address indexed to, uint256 amount);

    /**
    * @dev Emitted when the curve parameters are updated
    * @param newExponent The new exponent value for the curve
    * @param newReserveRatio The new reserve ratio in ppm
    */
    event CurveParametersUpdated(uint256 newExponent, uint256 newReserveRatio);

    /**
    * @dev Emitted when the reserve ratio is updated
    * @param newRatio The new reserve ratio in ppm
    */
    event ReserveRatioUpdated(uint256 newRatio);

    /**
     * @dev Allows a user to buy tokens with ETH
     * @param minReturn Minimum amount of tokens to receive
     * @return Amount of tokens purchased
     */
    function buy(uint256 minReturn) external payable returns (uint256);

    /**
     * @dev Allows a user to sell tokens for ETH
     * @param tokenAmount Amount of tokens to sell
     * @param minReturn Minimum amount of ETH to receive
     * @return Amount of ETH received
     */
    function sell(uint256 tokenAmount, uint256 minReturn) external returns (uint256);

    /**
     * @dev Calculates the amount of tokens that can be purchased with a given amount of ETH
     * @param ethAmount Amount of ETH to spend
     * @return Amount of tokens that would be received
     */
    function calculateBuyReturn(uint256 ethAmount) external view returns (uint256);

    /**
     * @dev Calculates the amount of ETH that would be received for selling a given amount of tokens
     * @param tokenAmount Amount of tokens to sell
     * @return Amount of ETH that would be received
     */
    function calculateSellReturn(uint256 tokenAmount) external view returns (uint256);

    /**
     * @dev Returns the reserve balance of the contract
     * @return Current reserve balance
     */
    function getReserveBalance() external view returns (uint256);

    /**
     * @dev Returns the address of the token used by the bonding curve
     * @return Address of the token contract
     */
    function getTokenAddress() external view returns (address);

    /**
     * @dev Pauses all token purchases and sales
     */
    function pause() external;

    /**
     * @dev Unpauses the contract
     */
    function unpause() external;

    /**
     * @dev Returns whether the contract is currently paused
     * @return True if paused, false otherwise
     */
    function isPaused() external view returns (bool);

    /**
     * @dev Returns the current price of the token
     * @return Current price in ETH per token
     */
    function getCurrentPrice() external view returns (uint256);

    /**
     * @dev Returns the market capitalization (total supply * current price)
     * @return Current market cap in ETH
     */
    function getMarketCap() external view returns (uint256);

    /**
     * @dev Returns the fully diluted valuation (max supply * current price)
     * @return Fully diluted valuation in ETH
     */
    function getFullyDilutedValuation() external view returns (uint256);
    
    /**
     * @dev Gets transaction history for a specific user
     * @param user Address of the user
     * @return Array of Transaction structs representing the user's buy and sell history
     */
    function getTransactionHistory(address user) external view returns (Transaction[] memory);
    
    /**
     * @dev Updates the curve parameters (only callable by owner)
     * @param newExponent New exponent value for the curve formula
     * @param newReserveRatio New reserve ratio in ppm
     */
    function updateCurveParameters(uint256 newExponent, uint256 newReserveRatio) external;
    
    /**
     * @dev Updates the reserve ratio (only callable by owner)
     * @param newRatio New reserve ratio in ppm
     */
    function updateReserveRatio(uint256 newRatio) external;
    
    /**
     * @dev Withdraws excess reserves (only callable by owner)
     * @param amount Amount of ETH to withdraw
     */
    function withdrawExcessReserves(uint256 amount) external;
} 