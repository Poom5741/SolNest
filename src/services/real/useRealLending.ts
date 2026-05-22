import { useCallback } from "react";
import { useAccount, useReadContracts, useWriteContract } from "wagmi";
import { type Address, type Abi } from "viem";
import { CONTRACTS, HARDHAT_CHAIN_ID } from "./contracts";
import _FactoryABI from "../../abis/ProjectMarketFactory.abi.json";
import _MarketABI from "../../abis/ProjectMarket.abi.json";
import _MockUSDCABI from "../../abis/MockUSDC.abi.json";
import type { LendingPosition, ProjectStatus } from "../../types";

const FactoryABI = _FactoryABI as Abi;
const MarketABI = _MarketABI as Abi;
const MockUSDCABI = _MockUSDCABI as Abi;

const STATUS_MAP: Record<number, ProjectStatus> = {
  0: "Created", 1: "Funding", 2: "Active", 3: "Repaid", 4: "Defaulted",
};

export default function useRealLending() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const { data: countData, refetch: refetchCount } = useReadContracts({
    contracts: address ? [
      {
        address: CONTRACTS.factory as Address,
        abi: FactoryABI,
        functionName: "getProjectCount",
        chainId: HARDHAT_CHAIN_ID,
      },
    ] : [],
    query: { enabled: !!address },
  });

  const projectCount = countData?.[0]?.result ? Number(countData[0].result) : 0;

  const indexContracts = Array.from({ length: projectCount }, (_, i) => ({
    address: CONTRACTS.factory as Address,
    abi: FactoryABI,
    functionName: "getProject" as const,
    args: [BigInt(i)] as const,
    chainId: HARDHAT_CHAIN_ID,
  }));

  const { data: addressesData, refetch: refetchAddresses } = useReadContracts({
    contracts: indexContracts,
    query: { enabled: projectCount > 0 && !!address },
  });

  const marketAddresses: Address[] = (addressesData
    ?.map((r) => r.result)
    .filter(Boolean) ?? []) as Address[];

  const investorContracts = marketAddresses.flatMap((addr) => [
    {
      address: addr,
      abi: MarketABI,
      functionName: "getInvestorInfo" as const,
      args: [address ?? ("0x0" as Address)],
      chainId: HARDHAT_CHAIN_ID,
    },
    {
      address: addr,
      abi: MarketABI,
      functionName: "getProjectInfo" as const,
      chainId: HARDHAT_CHAIN_ID,
    },
    {
      address: addr,
      abi: MarketABI,
      functionName: "balanceOf" as const,
      args: [address ?? ("0x0" as Address)],
      chainId: HARDHAT_CHAIN_ID,
    },
    {
      address: addr,
      abi: MarketABI,
      functionName: "status" as const,
      chainId: HARDHAT_CHAIN_ID,
    },
  ]);

  const { data: investorData, refetch: refetchInvestor } = useReadContracts({
    contracts: investorContracts,
    query: { enabled: marketAddresses.length > 0 && !!address },
  });

  const rawResults = investorData ?? [];

  const positions: LendingPosition[] | null = marketAddresses.length > 0 && rawResults.length > 0
    ? marketAddresses.map((addr, i) => {
        const base = i * 4;
        const invInfo = rawResults[base]?.result as { deposited: bigint; claimed: bigint } | undefined;
        const projInfo = rawResults[base + 1]?.result as readonly [
          bigint, bigint, bigint, bigint, bigint,
          bigint, bigint, `0x${string}`, string, bigint, bigint,
        ] | undefined;
        const lpBalance = rawResults[base + 2]?.result as bigint | undefined;
        const statusVal = rawResults[base + 3]?.result as number | undefined;

        if (!invInfo || Number(invInfo.deposited) === 0) return null;

        const deposited = Number(invInfo.deposited) / 1_000_000;
        const claimed = Number(invInfo.claimed) / 1_000_000;
        const lpTokens = lpBalance ? Number(lpBalance) / 1_000_000 : 0;
        const apy = projInfo ? Number(projInfo[3]) / 100 : 0;
        const totalRepaid = projInfo ? Number(projInfo[2]) / 1_000_000 : 0;
        const totalFunded = projInfo ? Number(projInfo[1]) / 1_000_000 : 0;

        let currentValue = deposited;
        if (totalRepaid > 0 && totalFunded > 0) {
          currentValue = (deposited / totalFunded) * totalRepaid;
        }

        return {
          projectId: `SOL-${String(i + 1).padStart(3, "0")}`,
          projectName: `Solar Project ${i + 1}`,
          amountInvested: deposited,
          lpTokens,
          currentValue,
          earnedYield: claimed > deposited ? claimed - deposited : (currentValue > deposited ? currentValue - deposited : 0),
          apy,
          projectStatus: STATUS_MAP[statusVal ?? 0] ?? "Created",
        };
      }).filter(Boolean) as LendingPosition[]
    : [];

  const deposit = useCallback(async (projectId: string, _projectName: string, amount: number) => {
    if (!address) return false;
    const idx = Number(projectId.replace("SOL-", "")) - 1;
    const marketAddr = marketAddresses[idx];
    if (!marketAddr) return false;

    const usdcAmount = BigInt(Math.round(amount * 1_000_000));

    try {
      await writeContractAsync({
        address: CONTRACTS.mockUSDC as Address,
        abi: MockUSDCABI,
        functionName: "approve",
        args: [marketAddr, usdcAmount],
        chainId: HARDHAT_CHAIN_ID,
      });
      await writeContractAsync({
        address: marketAddr,
        abi: MarketABI,
        functionName: "deposit",
        args: [usdcAmount],
        chainId: HARDHAT_CHAIN_ID,
      });
      refetchInvestor();
      return true;
    } catch {
      return false;
    }
  }, [address, marketAddresses, writeContractAsync]);

  const withdraw = useCallback(async (projectId: string, amount: number) => {
    if (!address) return false;
    const idx = Number(projectId.replace("SOL-", "")) - 1;
    const marketAddr = marketAddresses[idx];
    if (!marketAddr) return false;

    try {
      await writeContractAsync({
        address: marketAddr,
        abi: MarketABI,
        functionName: "withdraw",
        args: [BigInt(Math.round(amount * 1_000_000))],
        chainId: HARDHAT_CHAIN_ID,
      });
      refetchInvestor();
      return true;
    } catch {
      return false;
    }
  }, [address, marketAddresses, writeContractAsync]);

  const claimRewards = useCallback(async (projectId: string) => {
    if (!address) return false;
    const idx = Number(projectId.replace("SOL-", "")) - 1;
    const marketAddr = marketAddresses[idx];
    if (!marketAddr) return false;

    try {
      await writeContractAsync({
        address: marketAddr,
        abi: MarketABI,
        functionName: "claimRewards",
        chainId: HARDHAT_CHAIN_ID,
      });
      refetchInvestor();
      return true;
    } catch {
      return false;
    }
  }, [address, marketAddresses, writeContractAsync]);

  const isLoading = false;
  const error: Error | null = null;

  return {
    data: positions.length > 0 ? positions : null,
    isLoading,
    error,
    mutate: () => { refetchCount(); refetchAddresses(); refetchInvestor(); },
    deposit,
    withdraw,
    claimRewards,
  };
}
