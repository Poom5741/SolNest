import { useMemo } from "react";
import type { LendingPosition, PortfolioSummary } from "../../types";

interface UseMockPortfolioReturn {
  data: PortfolioSummary;
  isLoading: boolean;
  error: string | null;
  mutate: () => void;
}

export function useMockPortfolio(positions: LendingPosition[]): UseMockPortfolioReturn {
  const summary = useMemo<PortfolioSummary>(() => {
    const active = positions.filter(p => p.projectStatus === "Funding" || p.projectStatus === "Active");
    return {
      totalInvested: positions.reduce((s, p) => s + p.amountInvested, 0),
      totalEarned: positions.reduce((s, p) => s + p.earnedYield, 0),
      activePositions: active.length,
      totalLpTokens: positions.reduce((s, p) => s + p.lpTokens, 0),
    };
  }, [positions]);

  return {
    data: summary,
    isLoading: false,
    error: null,
    mutate: () => {},
  };
}
