import { useReadContract, useReadContracts } from "wagmi";
import { type Address, type Abi } from "viem";
import { useMemo } from "react";
import { CONTRACTS, HARDHAT_CHAIN_ID } from "./contracts";
import _FactoryABI from "../../abis/ProjectMarketFactory.abi.json";
import _MarketABI from "../../abis/ProjectMarket.abi.json";
import type { Project, RiskLevel, ProjectStatus } from "../../types";

const FactoryABI = _FactoryABI as Abi;
const MarketABI = _MarketABI as Abi;

const STATUS_MAP: Record<number, ProjectStatus> = {
  0: "Created",
  1: "Funding",
  2: "Active",
  3: "Repaid",
  4: "Defaulted",
};

export default function useRealProjects() {
  const { data: countData, refetch: refetchCount } = useReadContract({
    address: CONTRACTS.factory as Address,
    abi: FactoryABI,
    functionName: "getProjectCount",
    chainId: HARDHAT_CHAIN_ID,
  });

  const projectCount = countData ? Number(countData) : 0;

  const projectIndexes = useMemo(
    () => Array.from({ length: projectCount }, (_, i) => i),
    [projectCount],
  );

  const marketAddressesQuery = useReadContracts({
    contracts: projectIndexes.map(
      (i) => ({
        address: CONTRACTS.factory as Address,
        abi: FactoryABI,
        functionName: "getProject" as const,
        args: [BigInt(i)] as const,
        chainId: HARDHAT_CHAIN_ID,
      }),
    ),
    query: { enabled: projectCount > 0 },
  });

  const marketAddresses = (marketAddressesQuery.data
    ?.map((r) => r.result)
    .filter(Boolean) ?? []) as Address[];

  const marketInfoQuery = useReadContracts({
    contracts: marketAddresses.flatMap((addr) => [
      {
        address: addr,
        abi: MarketABI,
        functionName: "getProjectInfo" as const,
        chainId: HARDHAT_CHAIN_ID,
      } as const,
      {
        address: addr,
        abi: MarketABI,
        functionName: "status" as const,
        chainId: HARDHAT_CHAIN_ID,
      } as const,
    ]),
    query: { enabled: marketAddresses.length > 0 },
  });

  const rawResults = marketInfoQuery.data ?? [];
  const infoResults = rawResults.filter((_, i) => i % 2 === 0).map((r) => r.result);
  const statusResults = rawResults.filter((_, i) => i % 2 === 1).map((r) => r.result);

  const projects: Project[] | null = marketAddresses.length > 0
    ? marketAddresses.map((addr, i) => {
        const rawInfo = infoResults[i];
        const rawStatus = statusResults[i];
        if (!rawInfo) {
          return {
            id: `SOL-${String(i + 1).padStart(3, "0")}`,
            name: `Project ${i + 1}`,
            location: "",
            systemSize: 0,
            targetAmount: 0,
            fundingProgress: 0,
            apy: 0,
            duration: 0,
            risk: "Moderate" as RiskLevel,
            status: "Created" as ProjectStatus,
            description: "",
            image: `/images/solar-${(i % 5) + 1}.jpg`,
            installerName: "SolNest Installer",
            investorCount: 0,
            createdAt: "",
          };
        }
        const info = rawInfo as readonly [
          bigint, bigint, bigint, bigint, bigint,
          bigint, bigint, `0x${string}`, string, bigint, bigint,
        ];
        const statusVal = rawStatus as number | undefined;
        const s = STATUS_MAP[statusVal ?? 0] ?? "Created";

        const riskScore = Number(info[5]);
        let risk: RiskLevel = "Moderate";
        if (riskScore <= 3) risk = "Low";
        else if (riskScore >= 7) risk = "High";

        return {
          id: `SOL-${String(i + 1).padStart(3, "0")}`,
          name: `Solar Project ${i + 1}`,
          location: `Location ${i + 1}`,
          systemSize: Number(info[3]) / 100,
          targetAmount: Number(info[0]) / 1_000_000,
          fundingProgress: Number(info[1]) > 0
            ? Math.round((Number(info[1]) / Number(info[0])) * 100 * 100) / 100
            : 0,
          apy: Number(info[3]) / 100,
          duration: Number(info[5]),
          risk,
          status: s,
          description: "",
          image: `/images/solar-${(i % 5) + 1}.jpg`,
          installerName: "SolNest Installer",
          investorCount: 0,
          createdAt: new Date(Number(info[9]) * 1000).toISOString(),
        };
      })
    : null;

  const isLoading = marketAddressesQuery.isLoading || marketInfoQuery.isLoading;
  const error = marketAddressesQuery.error || marketInfoQuery.error || null;

  return {
    data: projects,
    isLoading,
    error: error instanceof Error ? error : error ? new Error(String(error)) : null,
    mutate: () => { refetchCount(); marketAddressesQuery.refetch(); marketInfoQuery.refetch(); },
    updateProjectStatus: async (_id: string, _status: ProjectStatus) => { return true; },
    addProject: async (_data: { name: string; location: string; systemSize: number; targetAmount: number; apy: number; duration: number; risk: import("../../types").RiskLevel; description: string; installerName: string }) => {},
    getProjectById: (_id: string) => projects?.find((p) => p.id === _id) ?? null,
  };
}
