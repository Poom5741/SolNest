import { useCallback } from "react";
import { useAccount, useConnect, useDisconnect, useBalance, useReadContract } from "wagmi";
import { type Address, type Abi } from "viem";
import { CONTRACTS, HARDHAT_CHAIN_ID } from "./contracts";
import _MockUSDCABI from "../../abis/MockUSDC.abi.json";
import type { WalletState } from "../../types";

const MockUSDCABI = _MockUSDCABI as Abi;

export default function useRealWallet() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  const { data: ethBalance } = useBalance({
    address,
    chainId: HARDHAT_CHAIN_ID,
  });

  const { data: rawBalance, refetch: refetchUsdc } = useReadContract({
    address: CONTRACTS.mockUSDC as Address,
    abi: MockUSDCABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: HARDHAT_CHAIN_ID,
    query: { enabled: !!address },
  });

  const usdcBalance = rawBalance ? Number(rawBalance) / 1_000_000 : 0;

  const handleConnect = useCallback(() => {
    if (connectors.length > 0) {
      connect({ connector: connectors[0], chainId: HARDHAT_CHAIN_ID });
    }
  }, [connect, connectors]);

  const handleDisconnect = useCallback(() => {
    disconnect();
  }, [disconnect]);

  const data: WalletState | null = isConnected && address
    ? { isConnected: true, address, usdcBalance }
    : null;

  return {
    data,
    isLoading: false,
    error: null,
    mutate: refetchUsdc,
    connect: handleConnect,
    disconnect: handleDisconnect,
    updateBalance: refetchUsdc,
  };
}
