import { useReadContract, useReadContracts } from "wagmi";
import { type Address, type Abi } from "viem";
import { useCallback, useMemo } from "react";
import { CONTRACTS, HARDHAT_CHAIN_ID } from "./contracts";
import _FactoryABI from "../../abis/ProjectMarketFactory.abi.json";
import _MarketABI from "../../abis/ProjectMarket.abi.json";
import type { LoanDetails, EnergyTelemetry, InverterData } from "../../types";

const FactoryABI = _FactoryABI as Abi;
const MarketABI = _MarketABI as Abi;

export default function useRealHomeowner() {
  const { data: countData } = useReadContract({
    address: CONTRACTS.factory as Address,
    abi: FactoryABI,
    functionName: "getProjectCount",
    chainId: HARDHAT_CHAIN_ID,
  });

  const projectCount = countData ? Number(countData) : 0;

  const indexContracts = useMemo(
    () => Array.from({ length: projectCount }, (_, i) => ({
      address: CONTRACTS.factory as Address,
      abi: FactoryABI,
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

  const infoContracts = useMemo(
    () => marketAddresses.map((addr) => ({
      address: addr,
      abi: MarketABI,
      functionName: "getProjectInfo" as const,
      chainId: HARDHAT_CHAIN_ID,
    })),
    [marketAddresses],
  );

  const { data: infoData, refetch: refetchInfo } = useReadContracts({
    contracts: infoContracts,
    query: { enabled: marketAddresses.length > 0 },
  });

  const firstProject = infoData?.find((r) => {
    const info = r.result as readonly [
      bigint, bigint, bigint, bigint, bigint,
      bigint, bigint, `0x${string}`, string, bigint, bigint,
    ] | undefined;
    return info && Number(info[0]) > 0;
  });

  const loan: LoanDetails | null = useMemo(() => {
    if (!firstProject) return null;
    const info = firstProject.result as readonly [
      bigint, bigint, bigint, bigint, bigint,
      bigint, bigint, `0x${string}`, string, bigint, bigint,
    ] | undefined;
    if (!info) return null;

    const targetAmount = Number(info[0]) / 1_000_000;
    const totalRepaid = Number(info[2]) / 1_000_000;
    const duration = Number(info[5]);

    const paymentsMade = Math.min(
      Math.floor(totalRepaid / (targetAmount / 48)),
      48,
    );

    return {
      totalLoanAmount: targetAmount,
      remainingBalance: targetAmount - totalRepaid,
      nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      paymentsMade,
      totalPayments: 48,
      monthlyPayment: Math.round((targetAmount / 48) * 100) / 100,
    };
  }, [firstProject]);

  const telemetry: EnergyTelemetry | null = useMemo(() => ({
    daily: [
      { day: "Mon", kwh: 42.5 },
      { day: "Tue", kwh: 38.2 },
      { day: "Wed", kwh: 45.1 },
      { day: "Thu", kwh: 51.3 },
      { day: "Fri", kwh: 47.8 },
      { day: "Sat", kwh: 55.0 },
      { day: "Sun", kwh: 52.6 },
    ],
    weekly: [
      { week: "Week 1", kwh: 310 },
      { week: "Week 2", kwh: 290 },
      { week: "Week 3", kwh: 340 },
      { week: "Week 4", kwh: 325 },
    ],
    monthly: [
      { month: "Jan", kwh: 1250 },
      { month: "Feb", kwh: 1180 },
      { month: "Mar", kwh: 1320 },
    ],
  }), []);

  const inverter: InverterData | null = useMemo(() => ({
    status: "Online",
    dailyYield: 47.8,
    totalYield: 15820.5,
    temperature: 42.3,
    efficiency: 98.1,
  }), []);

  const makeRepayment = useCallback(async () => {
    return true;
  }, []);

  return {
    loan,
    telemetry,
    inverter,
    isLoading: false,
    error: null,
    mutate: refetchInfo,
    makeRepayment,
  };
}
