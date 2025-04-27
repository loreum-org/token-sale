/**
 * Formats a number to display with a specified number of decimal places
 * @param value The number to format
 * @param decimals The number of decimal places to show
 * @returns Formatted string
 */
export const formatNumber = (value: string | number, decimals: number = 4): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return '0';
  }
  
  if (numValue === 0) {
    return '0';
  }
  
  // For very small numbers, use scientific notation
  if (numValue < 0.00001) {
    return numValue.toExponential(decimals);
  }
  
  // For very large numbers, use abbreviations
  if (numValue >= 1_000_000_000) {
    return `${(numValue / 1_000_000_000).toFixed(decimals)}B`;
  }
  
  if (numValue >= 1_000_000) {
    return `${(numValue / 1_000_000).toFixed(decimals)}M`;
  }
  
  if (numValue >= 1_000) {
    return `${(numValue / 1_000).toFixed(decimals)}K`;
  }
  
  // For regular numbers, use fixed decimals
  return numValue.toFixed(decimals);
};

/**
 * Formats a price value with currency symbol
 * @param price The price value to format
 * @returns Formatted price string
 */
export const formatPrice = (price: string | number): string => {
  const numValue = typeof price === 'string' ? parseFloat(price) : price;
  
  if (isNaN(numValue)) {
    return 'Ξ0.00';
  }
  
  if (numValue < 0.01) {
    return `Ξ${numValue.toFixed(6)}`;
  }
  
  return `Ξ${numValue.toFixed(4)}`;
};

/**
 * Formats a large number for display
 * @param value The value to format
 * @returns Formatted large number string
 */
export const formatLargeNumber = (value: string | number): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return 'Ξ0';
  }
  
  if (numValue >= 1_000_000_000) {
    return `Ξ${(numValue / 1_000_000_000).toFixed(2)}B`;
  }
  
  if (numValue >= 1_000_000) {
    return `Ξ${(numValue / 1_000_000).toFixed(2)}M`;
  }
  
  if (numValue >= 1_000) {
    return `Ξ${(numValue / 1_000).toFixed(2)}K`;
  }
  
  return `Ξ${numValue.toFixed(2)}`;
};

/**
 * Calculates the price impact of a trade
 * @param tradeAmount Amount being traded
 * @param currentPrice Current token price
 * @param tradeType 'buy' or 'sell'
 * @returns Price impact percentage as a decimal
 */
export const calculatePriceImpact = (
  tradeAmount: string,
  currentPrice: string,
  expectedOutput: string,
  tradeType: 'buy' | 'sell'
): number => {
  const tradeAmountNum = parseFloat(tradeAmount);
  const currentPriceNum = parseFloat(currentPrice);
  const expectedOutputNum = parseFloat(expectedOutput);
  
  if (isNaN(tradeAmountNum) || isNaN(currentPriceNum) || isNaN(expectedOutputNum) || tradeAmountNum === 0) {
    return 0;
  }
  
  if (tradeType === 'buy') {
    // For buys, price impact is the difference between the expected price and the actual price
    const expectedPrice = tradeAmountNum / expectedOutputNum;
    return Math.abs((expectedPrice - currentPriceNum) / currentPriceNum);
  } else {
    // For sells, price impact is the difference between the expected return and the actual return
    const expectedReturn = tradeAmountNum * currentPriceNum;
    return Math.abs((expectedReturn - expectedOutputNum) / expectedReturn);
  }
};

/**
 * Generates data points for the bonding curve chart
 * @param supplyRange Array of supply points to calculate
 * @param curveExponent The exponent of the curve function
 * @param curveCoefficient The coefficient of the curve function
 * @returns Array of price points
 */
export const generateCurveData = (
  supplyRange: number[],
  curveExponent: number = 2,
  curveCoefficient: number = 0.0000001
): { supply: number; price: number }[] => {
  return supplyRange.map(supply => ({
    supply,
    price: curveCoefficient * Math.pow(supply, curveExponent)
  }));
};

/**
 * Generates a range of supply points for the chart
 * @param currentSupply Current token supply
 * @param maxSupply Maximum token supply
 * @param numPoints Number of data points to generate
 * @returns Array of supply points
 */
export const generateSupplyRange = (
  currentSupply: number,
  maxSupply: number,
  numPoints: number = 50
): number[] => {
  const range: number[] = [];
  const step = (maxSupply - 0) / (numPoints - 1);
  
  for (let i = 0; i < numPoints; i++) {
    range.push(Math.max(0, Math.min(maxSupply, i * step)));
  }
  
  return range;
};

/**
 * Validates if a string contains a valid number
 * @param value String to validate
 * @returns True if string is a valid number
 */
export const isValidNumber = (value: string): boolean => {
  if (!value) return false;
  
  const numValue = parseFloat(value);
  return !isNaN(numValue) && numValue >= 0;
};

/**
 * Truncates an Ethereum address for display
 * @param address The address to truncate
 * @returns Truncated address string
 */
export const truncateAddress = (address: string): string => {
  if (!address) return '';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};
