import { useMemo } from "react";
import type { LendingPosition, PortfolioSummary } from "../../types";

export default function useRealPortfolio(positions: LendingPosition[] | null) {
  const data: PortfolioSummary | null = useMemo(() => {
    if (!positions || positions.length === 0) return null;

    const active = positions.filter((p) =>
      p.projectStatus === "Funding" || p.projectStatus === "Active"
    );

    return {
      totalInvested: positions.reduce((s, p) => s + p.amountInvested, 0),
      totalEarned: positions.reduce((s, p) => s + p.earnedYield, 0),
      activePositions: active.length,
      totalLpTokens: positions.reduce((s, p) => s + p.lpTokens, 0),
    };
  }, [positions]);

  return {
    data,
    isLoading: false,
    error: null,
    mutate: () => {},
  };
}
