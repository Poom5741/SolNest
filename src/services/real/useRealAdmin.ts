import { useCallback } from "react";
import { useAccount, useWriteContract, useReadContracts } from "wagmi";
import { type Address } from "viem";
import { useMemo } from "react";
import { CONTRACTS, HARDHAT_CHAIN_ID } from "./contracts";
import FactoryABI from "../../abis/ProjectMarketFactory.abi.json";
import MarketABI from "../../abis/ProjectMarket.abi.json";
import type { Abi } from "viem";
import type { AdminProjectForm, ProjectStatus } from "../../types";

const factoryAbi = FactoryABI as Abi;
const marketAbi = MarketABI as Abi;

const LIFECYCLE_FN: Record<string, "startFunding" | "activate" | "finalizeProject" | "markDefaulted"> = {
  Funding: "startFunding",
  Active: "activate",
  Repaid: "finalizeProject",
  Defaulted: "markDefaulted",
};

export default function useRealAdmin(
  _addProject: (form: AdminProjectForm) => void,
  _updateProjectStatus: (id: string, status: ProjectStatus) => void,
) {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const { data: countData } = useReadContracts({
    contracts: [{
      address: CONTRACTS.factory as Address,
      abi: factoryAbi,
      functionName: "getProjectCount",
      chainId: HARDHAT_CHAIN_ID,
    }],
  });

  const projectCount = countData?.[0]?.result ? Number(countData[0].result) : 0;

  const indexContracts = useMemo(
    () => Array.from({ length: projectCount }, (_, i) => ({
      address: CONTRACTS.factory as Address,
      abi: factoryAbi,
      functionName: "getProject" as const,
      args: [BigInt(i)] as const,
      chainId: HARDHAT_CHAIN_ID,
    })),
    [projectCount],
  );

  const { data: addressesData } = useReadContracts({
    contracts: indexContracts,
    query: { enabled: projectCount > 0 },
  });

  const marketAddresses: Address[] = (addressesData
    ?.map((r) => r.result)
    .filter(Boolean) ?? []) as Address[];

  const createProject = useCallback(async (form: AdminProjectForm) => {
    if (!address) return;

    const targetAmount = BigInt(Math.round(form.targetAmount * 1_000_000));
    const apy = BigInt(Math.round(form.apy * 100));
    const duration = BigInt(form.duration * 365 * 24 * 3600);

    try {
      await writeContractAsync({
        address: CONTRACTS.factory as Address,
        abi: factoryAbi,
        functionName: "createProject",
        args: [
          address,
          targetAmount,
          apy,
          duration,
          BigInt(form.risk === "High" ? 7 : form.risk === "Low" ? 3 : 5),
          `ipfs://${form.name.toLowerCase().replace(/\s+/g, "-")}`,
        ],
        chainId: HARDHAT_CHAIN_ID,
      });
    } catch {}
  }, [address, writeContractAsync]);

  const updateStatus = useCallback(async (projectId: string, status: ProjectStatus) => {
    if (!address) return;

    const idx = Number(projectId.replace("SOL-", "")) - 1;
    const marketAddr = marketAddresses[idx];
    if (!marketAddr) return;

    const fnName = LIFECYCLE_FN[status];
    if (!fnName) return;

    try {
      await writeContractAsync({
        address: marketAddr,
        abi: marketAbi,
        functionName: fnName,
        chainId: HARDHAT_CHAIN_ID,
      });
    } catch {}
  }, [address, marketAddresses, writeContractAsync]);

  return {
    data: null,
    isLoading: false,
    error: null,
    mutate: () => {},
    createProject,
    updateStatus,
  };
}
