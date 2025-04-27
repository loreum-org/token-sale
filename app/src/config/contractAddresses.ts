interface ContractAddresses {
  loreToken: string;
  bondingCurve: string;
}

interface NetworkConfig {
  [key: string]: ContractAddresses;
}

const addresses: NetworkConfig = {
  // Mainnet addresses
  '1': {
    loreToken: '0x7756d245527f5f8925a537be509bf54feb2fdc99',
    bondingCurve: '0x5FbDB2315678afecb367f032d93F642f64180aa3', // Update with actual mainnet address when deployed
  },
  // Goerli testnet
  '5': {
    loreToken: '0x7756d245527f5f8925a537be509bf54feb2fdc99', // Updated from placeholder
    bondingCurve: '0x5FbDB2315678afecb367f032d93F642f64180aa3', // Updated from placeholder
  },
  // Sepolia testnet
  '11155111': {
    loreToken: '0x7756d245527f5f8925a537be509bf54feb2fdc99', // Updated from placeholder
    bondingCurve: '0x5FbDB2315678afecb367f032d93F642f64180aa3', // Updated from placeholder
  },
  // Local development (Hardhat)
  '31337': {
    loreToken: '0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6', // Default Hardhat deployment address
    bondingCurve: '0x610178dA211FEF7D417bC0e6FeD39F05609AD788', // Default Hardhat deployment address
  },
};

export const getContractAddresses = (chainId: string): ContractAddresses => {
  const networkAddresses = addresses[chainId];
  if (!networkAddresses) {
    console.warn(`No contract addresses found for chain ID ${chainId}, defaulting to Hardhat network`);
    return addresses['31337']; // Default to local hardhat network
  }
  return networkAddresses;
};

export default addresses;
