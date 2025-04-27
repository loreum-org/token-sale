import { ethers } from 'ethers';
import { getContractAddresses } from '../config/contractAddresses';
import LoreTokenABI from '../config/abis/LoreToken.json';
import BondingCurveABI from '../config/abis/BondingCurve.json';

// Define a type for the ethereum provider with event handlers
type EthereumProvider = ethers.Eip1193Provider & {
  on(event: string, callback: any): void;
  removeListener(event: string, callback: any): void;
};

let provider: ethers.BrowserProvider | null = null;
let signer: ethers.Signer | null = null;
let loreTokenContract: ethers.Contract | null = null;
let bondingCurveContract: ethers.Contract | null = null;
let chainChangeCallbacks: ((chainId: string) => void)[] = [];
let accountChangeCallbacks: ((accounts: string[]) => void)[] = [];

export const initWeb3 = async (): Promise<boolean> => {
  try {
    if (typeof window === 'undefined' || !window.ethereum) {
      console.error('No ethereum provider detected');
      return false;
    }

    provider = new ethers.BrowserProvider(window.ethereum);
    
    // Request account access
    const accounts = await provider.send('eth_requestAccounts', []);
    
    if (accounts.length === 0) {
      console.error('No accounts found');
      return false;
    }

    signer = await provider.getSigner();
    
    // Get network
    const network = await provider.getNetwork();
    const chainId = network.chainId.toString();
    
    // Get contract addresses for current network
    const addresses = getContractAddresses(chainId);
    
    // Validate addresses
    if (!addresses.loreToken || addresses.loreToken === '0x0000000000000000000000000000000000000000') {
      console.error(`LoreToken contract not available on network ${chainId}`);
      return false;
    }
    
    // Initialize contracts
    try {
      // Initialize token contract
      loreTokenContract = new ethers.Contract(
        addresses.loreToken,
        LoreTokenABI,
        signer
      );
      
      // Verify token contract works
      await loreTokenContract.name();
      
      // Initialize bonding curve contract
      // Even if the address is empty, we'll create a contract instance to prevent errors
      // later in the code, but we won't try to validate it
      if (addresses.bondingCurve && addresses.bondingCurve !== '0x0000000000000000000000000000000000000000') {
        try {
          bondingCurveContract = new ethers.Contract(
            addresses.bondingCurve,
            BondingCurveABI,
            signer
          );
          
          // Try to validate but don't fail if this doesn't work
          await bondingCurveContract.getCurrentPrice();
          console.log("Bonding curve contract validated successfully");
        } catch (bondingError) {
          console.warn("Bonding curve contract validation failed:", bondingError);
          // We'll still keep the contract instance, but some functions might not work
        }
      } else {
        console.warn("No valid bonding curve contract address for this network");
      }
      
      // Set up event listeners for account and chain changes
      setupEventListeners();
      
      return true;
    } catch (contractError) {
      console.error('Error initializing contracts:', contractError);
      // Reset contracts on error
      loreTokenContract = null;
      bondingCurveContract = null;
      return false;
    }
  } catch (error) {
    console.error('Error initializing web3:', error);
    return false;
  }
};

// Set up event listeners for account and chain changes
const setupEventListeners = () => {
  if (typeof window === 'undefined' || !window.ethereum) {
    return;
  }
  
  // Listen for account changes
  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      // User disconnected their wallet
      disconnectWeb3();
    }
    
    // Notify all callbacks
    accountChangeCallbacks.forEach(callback => callback(accounts));
  };
  
  // Listen for chain changes
  const handleChainChanged = (chainId: string) => {
    // Reload contracts for the new chain
    initWeb3();
    
    // Notify all callbacks
    chainChangeCallbacks.forEach(callback => callback(chainId));
  };
  
  // Remove existing listeners before adding new ones
  try {
    window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
    window.ethereum.removeListener('chainChanged', handleChainChanged);
  } catch (error) {
    console.log('No previous listeners to remove');
  }
  
  // Add listeners
  window.ethereum.on('accountsChanged', handleAccountsChanged);
  window.ethereum.on('chainChanged', handleChainChanged);
};

export const getTokenContract = () => {
  if (!loreTokenContract) {
    throw new Error('Token contract not initialized');
  }
  return loreTokenContract;
};

export const getBondingCurveContract = () => {
  if (!bondingCurveContract) {
    throw new Error('Bonding curve contract not initialized');
  }
  return bondingCurveContract;
};

export const getProvider = () => {
  if (!provider) {
    throw new Error('Provider not initialized');
  }
  return provider;
};

export const getSigner = () => {
  if (!signer) {
    throw new Error('Signer not initialized');
  }
  return signer;
};

export const getAccount = async (): Promise<string> => {
  if (!signer) {
    throw new Error('Signer not initialized');
  }
  return await signer.getAddress();
};

export const getChainId = async (): Promise<string> => {
  if (!provider) {
    throw new Error('Provider not initialized');
  }
  const network = await provider.getNetwork();
  return network.chainId.toString();
};

export const listenToAccountChanges = (callback: (accounts: string[]) => void) => {
  accountChangeCallbacks.push(callback);
};

export const listenToChainChanges = (callback: (chainId: string) => void) => {
  chainChangeCallbacks.push(callback);
};

export const disconnectWeb3 = () => {
  provider = null;
  signer = null;
  loreTokenContract = null;
  bondingCurveContract = null;
  
  // Clear callbacks
  accountChangeCallbacks = [];
  chainChangeCallbacks = [];
};

// Add global type for window.ethereum
declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}
