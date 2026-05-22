import { createConfig, http, WagmiProvider } from "wagmi";
import { type Chain } from "viem";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { injected } from "wagmi/connectors";
import { HARDHAT_CHAIN_ID } from "./real/contracts";

const hardhatLocalhost = {
  id: HARDHAT_CHAIN_ID,
  name: "Hardhat Localhost",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["http://127.0.0.1:8545"] },
  },
} as const satisfies Chain;

const config = createConfig({
  chains: [hardhatLocalhost],
  connectors: [injected()],
  transports: {
    [HARDHAT_CHAIN_ID]: http("http://127.0.0.1:8545"),
  },
});

const queryClient = new QueryClient();

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
