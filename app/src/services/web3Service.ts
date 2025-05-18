import { ethers } from 'ethers';
import { getContractAddresses } from '../config/contractAddresses';
import LoreTokenABI from '../config/abis/LoreToken.json';
import BondingCurveABI from '../config/abis/BondingCurve.json';


let provider: ethers.BrowserProvider | null = null;
let signer: ethers.Signer | null = null;
let loreTokenContract: ethers.Contract | null = null;
let bondingCurveContract: ethers.Contract | null = null;
let chainChangeCallbacks: ((chainId: string) => void)[] = [];
let accountChangeCallbacks: ((accounts: string[]) => void)[] = [];
// Track if we're using a mock provider
let isMockProvider = false;

// Mock provider implementation for simulation mode
class MockProvider {
  async send(method: string, params: any[]): Promise<any> {
    switch (method) {
      case 'eth_requestAccounts':
        return ['0xMock0000000000000000000000000000000001'];
      case 'eth_chainId':
        return '0x1'; // Mainnet
      case 'eth_getBalance':
        return ethers.parseEther('10').toString();
      default:
        console.log(`Mock provider received method: ${method}`);
        return null;
    }
  }

  on(event: string, callback: any): void {
    console.log(`Mock provider registered event: ${event}`);
  }

  removeListener(event: string, callback: any): void {
    console.log(`Mock provider removed event: ${event}`);
  }
}

// Mock signer implementation
class MockSigner {
  async getAddress(): Promise<string> {
    return '0xMock0000000000000000000000000000000001';
  }
}

// Mock token contract implementation
class MockTokenContract {
  async name(): Promise<string> {
    return 'LORE Token';
  }

  async symbol(): Promise<string> {
    return 'LORE';
  }

  async decimals(): Promise<number> {
    return 18;
  }

  async totalSupply(): Promise<bigint> {
    return ethers.parseUnits('100000', 18);
  }

  async maxSupply(): Promise<bigint> {
    return ethers.parseUnits('1000000', 18);
  }

  async balanceOf(): Promise<bigint> {
    return ethers.parseUnits('1000', 18);
  }

  async allowance(): Promise<bigint> {
    return ethers.parseUnits('0', 18);
  }

  async approve(): Promise<any> {
    return { wait: async () => {} };
  }
}

// Mock bonding curve contract implementation
class MockBondingCurveContract {
  async getCurrentPrice(): Promise<bigint> {
    return ethers.parseEther('0.001');
  }

  async getMarketCap(): Promise<bigint> {
    return ethers.parseEther('100');
  }

  async getFullyDilutedValuation(): Promise<bigint> {
    return ethers.parseEther('1000');
  }

  async getReserveBalance(): Promise<bigint> {
    return ethers.parseEther('50');
  }

  async calculateBuyReturn(weiAmount: bigint): Promise<bigint> {
    // Simple linear calculation for simulation
    return weiAmount * BigInt(1000);
  }

  async calculateSellReturn(tokenAmount: bigint): Promise<bigint> {
    // Simple linear calculation for simulation
    return tokenAmount / BigInt(1000);
  }

  async buy(): Promise<any> {
    return { wait: async () => {} };
  }

  async sell(): Promise<any> {
    return { wait: async () => {} };
  }

  get target(): string {
    return '0xMockBondingCurve00000000000000000001';
  }
}

export const initWeb3 = async (): Promise<boolean> => {
  try {
    if (typeof window === 'undefined' || !window.ethereum) {
      console.log('No ethereum provider detected, using mock provider for simulation');
      
      // Create mock provider and signer
      isMockProvider = true;
      
      // We don't create an actual BrowserProvider, but we set up our mock contracts
      loreTokenContract = new MockTokenContract() as unknown as ethers.Contract;
      bondingCurveContract = new MockBondingCurveContract() as unknown as ethers.Contract;
      signer = new MockSigner() as unknown as ethers.Signer;
      
      return true;
    }

    provider = new ethers.BrowserProvider(window.ethereum);
    isMockProvider = false;
    
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
  if (typeof window === 'undefined' || !window.ethereum || isMockProvider) {
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
  if (isMockProvider) {
    return new MockProvider() as unknown as ethers.BrowserProvider;
  }
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
  if (isMockProvider) {
    return '1'; // Mock mainnet
  }
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
  isMockProvider = false;
  
  // Clear callbacks
  accountChangeCallbacks = [];
  chainChangeCallbacks = [];
};

export const isSimulationMode = () => {
  return isMockProvider;
};

// Add global type for window.ethereum

