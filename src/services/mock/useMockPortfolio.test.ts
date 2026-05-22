import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useMockPortfolio } from './useMockPortfolio';
import type { LendingPosition } from '../../types';

function makePosition(overrides: Partial<LendingPosition> = {}): LendingPosition {
  return {
    projectId: 'SOL-001',
    projectName: 'Solar Farm',
    amountInvested: 1000,
    lpTokens: 1000,
    currentValue: 1050,
    earnedYield: 50,
    apy: 12.5,
    projectStatus: 'Funding',
    ...overrides,
  };
}

describe('useMockPortfolio', () => {
  it('returns zero totals for empty positions array', () => {
    const { result } = renderHook(() => useMockPortfolio([]));
    expect(result.current.data.totalInvested).toBe(0);
    expect(result.current.data.totalEarned).toBe(0);
    expect(result.current.data.activePositions).toBe(0);
    expect(result.current.data.totalLpTokens).toBe(0);
  });

  it('aggregates totals from positions', () => {
    const positions: LendingPosition[] = [
      makePosition({ amountInvested: 1000, earnedYield: 50, lpTokens: 1000 }),
      makePosition({
        projectId: 'SOL-002',
        projectName: 'Wind Park',
        amountInvested: 2000,
        earnedYield: 100,
        lpTokens: 2000,
      }),
    ];
    const { result } = renderHook(() => useMockPortfolio(positions));
    expect(result.current.data.totalInvested).toBe(3000);
    expect(result.current.data.totalEarned).toBe(150);
    expect(result.current.data.totalLpTokens).toBe(3000);
  });

  it('returns isLoading=false always', () => {
    const positions = [makePosition()];
    const { result } = renderHook(() => useMockPortfolio(positions));
    expect(result.current.isLoading).toBe(false);
  });

  it('returns error=null always', () => {
    const positions = [makePosition()];
    const { result } = renderHook(() => useMockPortfolio(positions));
    expect(result.current.error).toBeNull();
  });

  it('counts active positions (Funding and Active status)', () => {
    const positions: LendingPosition[] = [
      makePosition({ projectId: 'SOL-001', projectStatus: 'Funding' }),
      makePosition({ projectId: 'SOL-002', projectStatus: 'Active' }),
      makePosition({ projectId: 'SOL-003', projectStatus: 'Repaid' }),
    ];
    const { result } = renderHook(() => useMockPortfolio(positions));
    expect(result.current.data.activePositions).toBe(2);
  });

  it('counts Active status as active', () => {
    const positions = [makePosition({ projectStatus: 'Active' })];
    const { result } = renderHook(() => useMockPortfolio(positions));
    expect(result.current.data.activePositions).toBe(1);
  });

  it('counts Repaid status as inactive', () => {
    const positions = [makePosition({ projectStatus: 'Repaid' })];
    const { result } = renderHook(() => useMockPortfolio(positions));
    expect(result.current.data.activePositions).toBe(0);
  });

  it('mutate is a no-op function', () => {
    const { result } = renderHook(() => useMockPortfolio([]));
    expect(() => result.current.mutate()).not.toThrow();
  });

  it('recalculates when positions array reference changes', () => {
    const initial = [makePosition({ amountInvested: 500 })];
    const { result, rerender } = renderHook(
      ({ positions }) => useMockPortfolio(positions),
      { initialProps: { positions: initial } }
    );
    expect(result.current.data.totalInvested).toBe(500);

    const updated = [makePosition({ amountInvested: 750 })];
    rerender({ positions: updated });
    expect(result.current.data.totalInvested).toBe(750);
  });
});
