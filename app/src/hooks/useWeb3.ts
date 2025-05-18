import { useCallback } from 'react';
import { useWeb3Context } from '../components/wallet/Web3Provider';
import { 
  initWeb3, 
  disconnectWeb3
} from '../services/web3Service';

export interface UseWeb3Return {
  isConnected: boolean;
  isConnecting: boolean;
  account: string | null;
  chainId: string | null;
  error: Error | null;
  isSimulationMode: boolean;
  connect: () => Promise<boolean>;
  disconnect: () => void;
}

const useWeb3 = (): UseWeb3Return => {
  const { initialized, isConnecting, error, account, chainId, isSimulation, retryConnection } = useWeb3Context();

  const connect = useCallback(async (): Promise<boolean> => {
    if (initialized) {
      return true;
    }
    
    retryConnection();
    return await initWeb3();
  }, [initialized, retryConnection]);

  const disconnect = useCallback(() => {
    disconnectWeb3();
  }, []);

  return {
    isConnected: initialized,
    isConnecting,
    account,
    chainId,
    error,
    isSimulationMode: isSimulation,
    connect,
    disconnect
  };
};

export default useWeb3; 