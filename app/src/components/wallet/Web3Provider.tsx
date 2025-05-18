'use client';

import { ReactNode, useState, useEffect, createContext, useContext } from 'react';
import { initWeb3, getChainId, getAccount, isSimulationMode } from '../../services/web3Service';

// Create context for web3 connection
export interface Web3ContextType {
  initialized: boolean;
  isConnecting: boolean;
  error: Error | null;
  chainId: string | null;
  account: string | null;
  isSimulation: boolean;
  retryConnection: () => void;
}

const defaultContext: Web3ContextType = {
  initialized: false,
  isConnecting: false,
  error: null,
  chainId: null,
  account: null,
  isSimulation: false,
  retryConnection: () => {}
};

export const Web3Context = createContext<Web3ContextType>(defaultContext);

// Hook to use web3 context
export const useWeb3Context = () => useContext(Web3Context);

interface Web3ProviderProps {
  children: ReactNode;
}

const Web3Provider = ({ children }: Web3ProviderProps) => {
  const [initialized, setInitialized] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [chainId, setChainId] = useState<string | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [isSimulation, setIsSimulation] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      try {
        setIsConnecting(true);
        setError(null);
        
        const success = await initWeb3();
        
        if (success) {
          const currentChainId = await getChainId();
          const currentAccount = await getAccount();
          const simulation = isSimulationMode();
          
          setChainId(currentChainId);
          setAccount(currentAccount);
          setInitialized(true);
          setIsSimulation(simulation);
          console.log("Web3 initialized successfully", simulation ? "(Simulation mode)" : "");
        } else {
          throw new Error('Failed to initialize web3 services');
        }
      } catch (err) {
        console.error('Error initializing web3:', err);
        setError(err instanceof Error ? err : new Error('Failed to initialize web3'));
      } finally {
        setIsConnecting(false);
      }
    };
    
    initialize();
  }, [retryCount]);

  const handleRetry = () => {
    setError(null);
    setRetryCount(prev => prev + 1);
  };

  const contextValue: Web3ContextType = {
    initialized,
    isConnecting,
    error,
    chainId,
    account,
    isSimulation,
    retryConnection: handleRetry
  };

  // Show simulation mode notice
  if (isSimulation && initialized) {
    return (
      <Web3Context.Provider value={contextValue}>
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                Running in simulation mode. No wallet is connected, but you can still explore the app functionality.
              </p>
            </div>
          </div>
        </div>
        {children}
      </Web3Context.Provider>
    );
  }

  // Error display component
  if (error) {
    return (
      <Web3Context.Provider value={contextValue}>
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex flex-col">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  {error.message || 'An error occurred while initializing web3. Please connect your wallet and make sure you are on the correct network.'}
                </p>
              </div>
            </div>
            <button 
              onClick={handleRetry}
              className="mt-3 ml-8 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Retry Connection
            </button>
          </div>
        </div>
        {children}
      </Web3Context.Provider>
    );
  }

  // Loading spinner
  if (isConnecting) {
    return (
      <Web3Context.Provider value={contextValue}>
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500 mr-3"></div>
          <p className="text-sm text-gray-700">Connecting to wallet...</p>
        </div>
        {children}
      </Web3Context.Provider>
    );
  }

  return (
    <Web3Context.Provider value={contextValue}>
      {children}
    </Web3Context.Provider>
  );
};

export default Web3Provider; 