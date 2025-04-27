// hooks/useProvider.ts
import { useState, useEffect, useMemo } from "react";
import { JsonRpcProvider, BrowserProvider, Eip1193Provider } from "ethers";
import { WalletConnectConnector } from "@web3-react/walletconnect-connector";

// Add type declaration for ethereum property on window
declare global {
  interface Window {
    ethereum?: Eip1193Provider;
  }
}

// Add proper type declaration for WalletConnectConnector
// This augments the existing type to include the provider property
declare module "@web3-react/walletconnect-connector" {
  interface WalletConnectConnector {
    provider?: Eip1193Provider;
  }
}

// RPC URLs for different networks
const RPC_URLS: { [chainId: number]: string } = {
  1:
    process.env.NEXT_PUBLIC_RPC_URL_MAINNET ||
    "https://mainnet.infura.io/v3/your-infura-key",
  11155111:
    process.env.NEXT_PUBLIC_RPC_URL_SEPOLIA ||
    "https://sepolia.infura.io/v3/your-infura-key",
  31337: process.env.NEXT_PUBLIC_RPC_URL_LOCALHOST || "http://localhost:8545",
};

// Default to Ethereum mainnet
const DEFAULT_CHAIN_ID = 1;

// WalletConnect setup
const walletconnect = new WalletConnectConnector({
  rpc: RPC_URLS,
  qrcode: true,
});

export default function useProvider() {
  // State variables
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number>(DEFAULT_CHAIN_ID);
  const [walletProvider, setWalletProvider] = useState<BrowserProvider | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);

  // Always create a fallback RPC provider based on current chainId
  const rpcProvider = useMemo(() => {
    const rpcUrl = RPC_URLS[chainId] || RPC_URLS[DEFAULT_CHAIN_ID];
    return new JsonRpcProvider(rpcUrl);
  }, [chainId]);

  // Return the wallet provider if connected, otherwise return the RPC provider
  const provider = walletProvider || rpcProvider;

  // Helper function to detect browser provider
  const getBrowserProvider = (): BrowserProvider | null => {
    if (typeof window !== "undefined") {
      // Check if any Ethereum provider exists (MetaMask, etc.)
      const ethereum = window?.ethereum as Eip1193Provider | undefined;
      if (ethereum) {
        return new BrowserProvider(ethereum);
      }
    }
    return null;
  };

  // Initialize wallet connection if browser has ethereum
  useEffect(() => {
    const checkBrowserWallet = async () => {
      const browserProvider = getBrowserProvider();

      if (browserProvider) {
        try {
          // Check if already connected
          const accounts = await browserProvider.listAccounts();
          if (accounts.length > 0) {
            setAccount(accounts[0].address);
            setWalletProvider(browserProvider);

            // Get current chain
            const network = await browserProvider.getNetwork();
            setChainId(Number(network.chainId));
          }
        } catch (err) {
          console.error("Error checking browser wallet:", err);
          // Don't set error here, just fall back to RPC provider
        }
      }
    };

    checkBrowserWallet();
  }, []);

  // Handle browser wallet events if available
  useEffect(() => {
    const browserProvider = getBrowserProvider();
    if (!browserProvider) return;

    const handleAccountsChanged = (accounts: Array<string>) => {
      if (accounts.length > 0) {
        setAccount(accounts[0]);
      } else {
        setAccount(null);
        setWalletProvider(null);
      }
    };

    const handleChainChanged = (hexChainId: string) => {
      const parsedChainId = parseInt(hexChainId, 16);
      setChainId(parsedChainId);

      // Refresh page on chain change as recommended by MetaMask
      if (walletProvider) {
        window.location.reload();
      }
    };

    const handleDisconnect = (error: { code: number; message: string }) => {
      console.log("Wallet disconnected:", error);
      setAccount(null);
      setWalletProvider(null);
    };

    // Use ethers provider events instead of direct ethereum events
    browserProvider.provider.on("accountsChanged", handleAccountsChanged);
    browserProvider.provider.on("chainChanged", handleChainChanged);
    browserProvider.provider.on("disconnect", handleDisconnect);

    return () => {
      // Clean up listeners
      browserProvider.provider.removeListener(
        "accountsChanged",
        handleAccountsChanged,
      );
      browserProvider.provider.removeListener(
        "chainChanged",
        handleChainChanged,
      );
      browserProvider.provider.removeListener("disconnect", handleDisconnect);
    };
  }, [walletProvider]);

  // Connect wallet function that supports multiple connection methods
  const connectWallet = async (
    connectionType: "browser" | "walletconnect" = "browser",
  ) => {
    setIsConnecting(true);
    setError(null);

    try {
      if (connectionType === "browser") {
        // Connect using browser wallet (MetaMask, etc.)
        const browserProvider = getBrowserProvider();

        if (browserProvider) {
          // Request accounts through the ethers provider
          const accounts = await browserProvider.send(
            "eth_requestAccounts",
            [],
          );

          if (accounts && accounts.length > 0) {
            setAccount(accounts[0]);
            setWalletProvider(browserProvider);

            const network = await browserProvider.getNetwork();
            setChainId(Number(network.chainId));

            return accounts[0];
          }
        } else {
          throw new Error(
            "No Ethereum browser extension detected. Please install MetaMask or use WalletConnect.",
          );
        }
      } else if (connectionType === "walletconnect") {
        // Connect using WalletConnect
        await walletconnect.activate();

        // For walletconnect, you need to adapt this based on ethers v6 approach
        const wcProvider = new BrowserProvider(
          walletconnect.provider as Eip1193Provider,
        );
        const accounts = await wcProvider.listAccounts();

        if (accounts.length > 0) {
          setAccount(accounts[0].address);
          setWalletProvider(wcProvider);

          const network = await wcProvider.getNetwork();
          setChainId(Number(network.chainId));

          return accounts[0].address;
        }
      }

      throw new Error("Failed to connect wallet. Please try again.");
    } catch (err: unknown) {
      console.error("Connection error:", err);
      setError(String(err) || "Failed to connect wallet");
      throw err;
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect wallet function
  const disconnectWallet = async () => {
    if (walletProvider) {
      // If using WalletConnect, deactivate it
      if (await walletconnect.getAccount()) {
        walletconnect.deactivate();
      }

      setAccount(null);
      setWalletProvider(null);
    }
  };

  // Switch network function
  const switchNetwork = async (newChainId: number) => {
    if (!walletProvider) return false;

    try {
      // Format chainId as hex string with 0x prefix
      const hexChainId = `0x${newChainId.toString(16)}`;

      try {
        // Try to switch to the network using ethers provider
        await walletProvider.send("wallet_switchEthereumChain", [
          { chainId: hexChainId },
        ]);
        return true;
      } catch (switchError: unknown) {
        // This error code indicates that the chain has not been added to MetaMask
        if (
          switchError &&
          typeof switchError === "object" &&
          "code" in switchError &&
          switchError.code === 4902
        ) {
          // Add the network using ethers provider
          await walletProvider.send("wallet_addEthereumChain", [
            {
              chainId: hexChainId,
              chainName: getNetworkName(newChainId),
              rpcUrls: [RPC_URLS[newChainId]],
              nativeCurrency: {
                name: "Ether",
                symbol: "ETH",
                decimals: 18,
              },
              blockExplorerUrls: [getBlockExplorerUrl(newChainId)],
            },
          ]);
          return true;
        }
        throw switchError;
      }

      return false;
    } catch (err) {
      console.error("Failed to switch network:", err);
      return false;
    }
  };

  // Helper functions
  const getNetworkName = (id: number): string => {
    switch (id) {
      case 1:
        return "Ethereum Mainnet";
      case 5:
        return "Goerli Testnet";
      case 11155111:
        return "Sepolia Testnet";
      default:
        return "Localhost Network";
    }
  };

  const getBlockExplorerUrl = (id: number): string => {
    switch (id) {
      case 1:
        return "https://etherscan.io";
      case 5:
        return "https://goerli.etherscan.io";
      case 11155111:
        return "https://sepolia.etherscan.io";
      default:
        return "";
    }
  };

  // Check if wallet is connected
  const isConnected = !!account && !!walletProvider;

  // Get network name
  const networkName = getNetworkName(chainId);

  return {
    account,
    provider,
    chainId,
    error,
    isConnecting,
    isConnected,
    networkName,
    connectWallet,
    disconnectWallet,
    switchNetwork,
  };
}
