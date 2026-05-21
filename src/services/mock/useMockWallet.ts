import { useState, useCallback } from "react";
import type { WalletState } from "../../types";

interface UseMockWalletReturn {
  data: WalletState;
  isLoading: boolean;
  error: string | null;
  mutate: () => void;
  connect: () => void;
  disconnect: () => void;
  updateBalance: (usdcDelta: number) => void;
}

export function useMockWallet(): UseMockWalletReturn {
  const [wallet, setWallet] = useState<WalletState>({
    isConnected: true,
    address: "0x71C4B...3E4A",
    usdcBalance: 12500,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error] = useState<string | null>(null);

  const connect = useCallback(() => {
    setIsLoading(true);
    setTimeout(() => {
      setWallet({
        isConnected: true,
        address: "0x" + Math.floor(Math.random() * 100000000).toString(16).toUpperCase() + "...C251",
        usdcBalance: 12500,
      });
      setIsLoading(false);
    }, 800);
  }, []);

  const disconnect = useCallback(() => {
    setWallet({ isConnected: false, address: "", usdcBalance: 0 });
  }, []);

  const updateBalance = useCallback((usdcDelta: number) => {
    setWallet(prev => ({
      ...prev,
      usdcBalance: Math.max(0, prev.usdcBalance + usdcDelta),
    }));
  }, []);

  const mutate = useCallback(() => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 500);
  }, []);

  return { data: wallet, isLoading, error, mutate, connect, disconnect, updateBalance };
}
