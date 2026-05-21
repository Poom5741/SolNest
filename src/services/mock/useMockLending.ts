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

export function useMockLending(): UseMockLendingReturn {
  const [positions, setPositions] = useState<LendingPosition[]>([]);
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
