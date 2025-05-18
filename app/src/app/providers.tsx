"use client";

import { WagmiProvider, createConfig, http } from "wagmi";
import { sepolia, mainnet } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider, getDefaultConfig } from "connectkit";
import { ReactNode } from "react";

// Configure chains - explicitly specify as const to satisfy type requirements
const chains = [sepolia, mainnet] as const;

// Create wagmi config
const config = createConfig(
  getDefaultConfig({
    appName: "LORE Token Simulator",
    // alchemyId: process.env.NEXT_PUBLIC_ALCHEMY_ID || "",
    walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "",
    chains,
    transports: {
      [sepolia.id]: http(),
      [mainnet.id]: http(),
    },
  })
);

// Create a query client
const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider theme="midnight">
          {children}
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
} 