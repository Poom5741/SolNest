import { useCallback, useMemo } from "react";
import {
  useAccount,
  useReadContract,
  useReadContracts,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { type Address, type Abi } from "viem";
import { CONTRACTS, HARDHAT_CHAIN_ID } from "./contracts";
import _SecondaryMarketABI from "../../abis/SecondaryMarket.abi.json";
import _MockUSDCABI from "../../abis/MockUSDC.abi.json";
import _MarketABI from "../../abis/ProjectMarket.abi.json";
import type { SecondaryListing } from "../../types";

const SecondaryMarketABI = _SecondaryMarketABI as Abi;
const MockUSDCABI = _MockUSDCABI as Abi;
const MarketABI = _MarketABI as Abi;

const SECONDARY_MARKET_ADDRESS = (import.meta.env.VITE_SECONDARY_MARKET_ADDRESS ?? "") as Address;
const USDC_DECIMALS = 1_000_000;

const REVERT_MESSAGES: Record<string, string> = {
  ListingNotActive: "This listing is no longer active.",
  ListingExpired: "This listing has expired.",
  SelfPurchase: "You cannot buy your own listing.",
  Unauthorized: "You are not authorized to perform this action.",
  ZeroAmount: "Amount must be greater than zero.",
  ZeroPrice: "Price must be greater than zero.",
  ZeroDuration: "Duration must be greater than zero.",
  ZeroAddress: "Invalid token address.",
  FeeTooHigh: "Fee exceeds maximum allowed.",
};

function mapRevertReason(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    const msg = String((error as { message: string }).message);
    for (const [key, value] of Object.entries(REVERT_MESSAGES)) {
      if (msg.includes(key)) return value;
    }
  }
  return "Transaction failed. Please try again.";
}

export default function useRealSecondaryMarket(walletAddress: string | undefined) {
  const { address } = useAccount();

  const { writeContractAsync, data: txHash } = useWriteContract();
  const { isLoading: isTxPending } = useWaitForTransactionReceipt({ hash: txHash });

  // Read nextListingId to know how many listings exist
  const { data: nextListingIdRaw, refetch: refetchCount } = useReadContract({
    address: SECONDARY_MARKET_ADDRESS,
    abi: SecondaryMarketABI,
    functionName: "nextListingId",
    chainId: HARDHAT_CHAIN_ID,
    query: { enabled: !!SECONDARY_MARKET_ADDRESS },
  });

  const nextListingId = nextListingIdRaw ? Number(nextListingIdRaw) : 0;

  // Read feeBasisPoints
  const { data: feeBpsRaw } = useReadContract({
    address: SECONDARY_MARKET_ADDRESS,
    abi: SecondaryMarketABI,
    functionName: "feeBasisPoints",
    chainId: HARDHAT_CHAIN_ID,
    query: { enabled: !!SECONDARY_MARKET_ADDRESS },
  });

  const feeBasisPoints = feeBpsRaw ? Number(feeBpsRaw) : 250;

  // Build listing read contracts
  const listingContracts = useMemo(
    () =>
      Array.from({ length: nextListingId }, (_, i) => ({
        address: SECONDARY_MARKET_ADDRESS,
        abi: SecondaryMarketABI,
        functionName: "listings" as const,
        args: [BigInt(i)] as const,
        chainId: HARDHAT_CHAIN_ID,
      })),
    [nextListingId],
  );

  const { data: listingsData, refetch: refetchListings, isLoading: isListingsLoading } = useReadContracts({
    contracts: listingContracts,
    query: { enabled: nextListingId > 0 },
  });

  // Parse listings from contract data
  const allListings: SecondaryListing[] = useMemo(() => {
    if (!listingsData) return [];

    return listingsData
      .map((result, i) => {
        if (!result.result) return null;
        const raw = result.result as readonly [bigint, string, string, bigint, bigint, bigint, boolean];
        const [id, seller, tokenContract, amount, price, expiresAt, active] = raw;

        const expiresAtMs = Number(expiresAt) * 1000;
        const isExpired = expiresAtMs < Date.now();

        let status: "active" | "expired" | "cancelled" | "sold";
        if (!active) {
          status = "sold";
        } else if (isExpired) {
          status = "expired";
        } else {
          status = "active";
        }

        const listing: SecondaryListing = {
          id: `LST-${String(Number(id)).padStart(3, "0")}`,
          listingId: Number(id),
          projectId: `PROJ-${tokenContract.slice(2, 8).toUpperCase()}`,
          projectName: `LP Token (${tokenContract.slice(0, 6)}...${tokenContract.slice(-4)})`,
          amount: Number(amount) / USDC_DECIMALS,
          price: Number(price) / USDC_DECIMALS,
          seller: seller as string,
          tokenContract: tokenContract as string,
          createdAt: new Date().toISOString().split("T")[0],
          expirationDate: Number(expiresAt),
          status,
          fee: feeBasisPoints,
          durationDays: Math.ceil((Number(expiresAt) - Date.now() / 1000) / 86400),
        };
        return listing;
      })
      .filter((l): l is NonNullable<typeof l> => l !== null);
  }, [listingsData, feeBasisPoints]);

  // Filter active listings (not sold, not cancelled)
  const listings = useMemo(
    () => allListings.filter((l) => l.status === "active" || l.status === "expired"),
    [allListings],
  );

  // My listings: seller matches connected wallet
  const normalizedWallet = walletAddress?.toLowerCase();
  const myListings = useMemo(
    () => allListings.filter((l) => l.seller.toLowerCase() === normalizedWallet),
    [allListings, normalizedWallet],
  );

  // LP token allowance check (for the first listing we might create)
  const { data: lpAllowanceRaw } = useReadContract({
    address: (myListings[0]?.tokenContract ?? CONTRACTS.factory) as Address,
    abi: MarketABI,
    functionName: "allowance",
    args: [address ?? ("0x0" as Address), SECONDARY_MARKET_ADDRESS],
    chainId: HARDHAT_CHAIN_ID,
    query: { enabled: !!address && !!SECONDARY_MARKET_ADDRESS },
  });

  const needsApproval = !lpAllowanceRaw || Number(lpAllowanceRaw) === 0;

  // USDC allowance check
  const { data: usdcAllowanceRaw, refetch: refetchUsdcAllowance } = useReadContract({
    address: CONTRACTS.mockUSDC as Address,
    abi: MockUSDCABI,
    functionName: "allowance",
    args: [address ?? ("0x0" as Address), SECONDARY_MARKET_ADDRESS],
    chainId: HARDHAT_CHAIN_ID,
    query: { enabled: !!address && !!SECONDARY_MARKET_ADDRESS },
  });

  const needsUsdcApproval = !usdcAllowanceRaw || Number(usdcAllowanceRaw) === 0;

  // Approve LP tokens for spending by SecondaryMarket
  const approveLpTokens = useCallback(
    async (tokenContract: string, amount: number) => {
      if (!address) return false;
      try {
        await writeContractAsync({
          address: tokenContract as Address,
          abi: MarketABI,
          functionName: "approve",
          args: [SECONDARY_MARKET_ADDRESS, BigInt(Math.round(amount * USDC_DECIMALS))],
          chainId: HARDHAT_CHAIN_ID,
        });
        return true;
      } catch (err) {
        return false;
      }
    },
    [address, writeContractAsync],
  );

  // Approve USDC for spending by SecondaryMarket
  const approveUsdc = useCallback(
    async (amount: number) => {
      if (!address) return false;
      try {
        await writeContractAsync({
          address: CONTRACTS.mockUSDC as Address,
          abi: MockUSDCABI,
          functionName: "approve",
          args: [SECONDARY_MARKET_ADDRESS, BigInt(Math.round(amount * USDC_DECIMALS))],
          chainId: HARDHAT_CHAIN_ID,
        });
        refetchUsdcAllowance();
        return true;
      } catch (err) {
        return false;
      }
    },
    [address, writeContractAsync, refetchUsdcAllowance],
  );

  // Create a listing: list(tokenContract, amount, price, durationDays)
  const createListing = useCallback(
    async (
      _projectId: string,
      _projectName: string,
      amount: number,
      price: number,
      _seller: string,
      durationDays = 7,
    ) => {
      if (!address) return;
      // For real hook, we need the token contract address.
      // The projectId maps to a ProjectMarket address via the factory.
      // For now, we use the first LP token contract the user has, or
      // the caller should pass the token contract via the projectId field.
      // In the real flow, the UI will pass the token contract address.
      try {
        await writeContractAsync({
          address: SECONDARY_MARKET_ADDRESS,
          abi: SecondaryMarketABI,
          functionName: "list",
          args: [
            _projectId as Address, // token contract address passed via projectId
            BigInt(Math.round(amount * USDC_DECIMALS)),
            BigInt(Math.round(price * USDC_DECIMALS)),
            BigInt(durationDays),
          ],
          chainId: HARDHAT_CHAIN_ID,
        });
        refetchCount();
        refetchListings();
      } catch (err) {
        throw new Error(mapRevertReason(err));
      }
    },
    [address, writeContractAsync, refetchCount, refetchListings],
  );

  // Buy a listing
  const buyListing = useCallback(
    async (listingId: string): Promise<boolean> => {
      if (!address) return false;
      // Extract numeric listing ID from string format "LST-001"
      const numericId = listingId.startsWith("LST-")
        ? parseInt(listingId.replace("LST-", ""), 10)
        : parseInt(listingId, 10);

      try {
        await writeContractAsync({
          address: SECONDARY_MARKET_ADDRESS,
          abi: SecondaryMarketABI,
          functionName: "buy",
          args: [BigInt(numericId)],
          chainId: HARDHAT_CHAIN_ID,
        });
        refetchListings();
        return true;
      } catch (err) {
        throw new Error(mapRevertReason(err));
      }
    },
    [address, writeContractAsync, refetchListings],
  );

  // Cancel a listing
  const cancelListing = useCallback(
    async (listingId: number): Promise<void> => {
      if (!address) return;
      try {
        await writeContractAsync({
          address: SECONDARY_MARKET_ADDRESS,
          abi: SecondaryMarketABI,
          functionName: "cancel",
          args: [BigInt(listingId)],
          chainId: HARDHAT_CHAIN_ID,
        });
        refetchListings();
      } catch (err) {
        throw new Error(mapRevertReason(err));
      }
    },
    [address, writeContractAsync, refetchListings],
  );

  const isLoading = isListingsLoading || isTxPending;
  const error: string | null = null;

  const mutate = useCallback(() => {
    refetchCount();
    refetchListings();
  }, [refetchCount, refetchListings]);

  const refresh = useCallback(() => {
    refetchCount();
    refetchListings();
  }, [refetchCount, refetchListings]);

  return {
    data: listings,
    myListings,
    isLoading,
    error,
    mutate,
    buyListing,
    createListing,
    cancelListing,
    refresh,
    needsApproval,
    needsUsdcApproval,
    approveLpTokens,
    approveUsdc,
  };
}
