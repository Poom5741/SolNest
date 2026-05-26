import { useState, useCallback } from "react";
import type { LendingPosition } from "../../types";

interface UseMockLendingReturn {
  data: LendingPosition[];
  isLoading: boolean;
  error: string | null;
  mutate: () => void;
  deposit: (projectId: string, projectName: string, amount: number) => Promise<boolean>;
  withdraw: (projectId: string, amount: number) => Promise<boolean>;
  claimRewards: (projectId: string) => Promise<boolean>;
}

function generatePosition(projectId: string, projectName: string, amount: number): LendingPosition {
  const apy = 10 + Math.random() * 6;
  return {
    projectId,
    projectName,
    amountInvested: amount,
    lpTokens: amount,
    currentValue: amount * (1 + Math.random() * 0.08),
    earnedYield: amount * Math.random() * 0.05,
    apy: Math.round(apy * 10) / 10,
    projectStatus: "Funding",
  };
}

const INITIAL_POSITIONS: LendingPosition[] = [
  { projectId: "SOL-001", projectName: "Bangkok Solar Community", amountInvested: 5000, lpTokens: 5000, currentValue: 5462.30, earnedYield: 462.30, apy: 12.5, projectStatus: "Funding" },
  { projectId: "SOL-002", projectName: "Chiang Mai Solar Farm", amountInvested: 3500, lpTokens: 3500, currentValue: 3681.40, earnedYield: 181.40, apy: 14.0, projectStatus: "Funding" },
  { projectId: "SOL-003", projectName: "Phuket Resort Solar", amountInvested: 4200, lpTokens: 4200, currentValue: 4587.20, earnedYield: 387.20, apy: 11.0, projectStatus: "Funding" },
  { projectId: "SOL-005", projectName: "Pattaya Residential Solar", amountInvested: 2100, lpTokens: 2100, currentValue: 2241.60, earnedYield: 141.60, apy: 10.0, projectStatus: "Active" },
  { projectId: "SOL-006", projectName: "Khon Kaen University Solar", amountInvested: 2000, lpTokens: 2000, currentValue: 2148.00, earnedYield: 148.00, apy: 13.2, projectStatus: "Funding" },
];

export function useMockLending(): UseMockLendingReturn {
  const [positions, setPositions] = useState<LendingPosition[]>(INITIAL_POSITIONS);
  const [isLoading, setIsLoading] = useState(false);
  const [error] = useState<string | null>(null);

  const deposit = useCallback(async (projectId: string, projectName: string, amount: number): Promise<boolean> => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 1000));

    setPositions(prev => {
      const existing = prev.find(p => p.projectId === projectId);
      if (existing) {
        return prev.map(p =>
          p.projectId === projectId
            ? { ...p, amountInvested: p.amountInvested + amount, lpTokens: p.lpTokens + amount }
            : p
        );
      }
      return [...prev, generatePosition(projectId, projectName, amount)];
    });

    setIsLoading(false);
    return true;
  }, []);

  const withdraw = useCallback(async (projectId: string, amount: number): Promise<boolean> => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 1000));

    setPositions(prev =>
      prev
        .map(p =>
          p.projectId === projectId
            ? { ...p, amountInvested: p.amountInvested - amount, lpTokens: p.lpTokens - amount }
            : p
        )
        .filter(p => p.amountInvested > 0)
    );

    setIsLoading(false);
    return true;
  }, []);

  const claimRewards = useCallback(async (projectId: string): Promise<boolean> => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 800));

    setPositions(prev =>
      prev.map(p =>
        p.projectId === projectId ? { ...p, earnedYield: 0 } : p
      )
    );

    setIsLoading(false);
    return true;
  }, []);

  const mutate = useCallback(() => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 500);
  }, []);

  return { data: positions, isLoading, error, mutate, deposit, withdraw, claimRewards };
}
