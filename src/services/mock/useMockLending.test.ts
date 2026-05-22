import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMockLending } from './useMockLending';

describe('useMockLending', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns initial empty positions array', () => {
    const { result } = renderHook(() => useMockLending());
    expect(result.current.data).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('deposit creates a new position', async () => {
    const { result } = renderHook(() => useMockLending());
    await act(async () => {
      result.current.deposit('SOL-001', 'Solar Farm', 1000);
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data[0].projectId).toBe('SOL-001');
    expect(result.current.data[0].projectName).toBe('Solar Farm');
    expect(result.current.data[0].amountInvested).toBe(1000);
    expect(result.current.data[0].lpTokens).toBe(1000);
  });

  it('deposit adds to existing position', async () => {
    const { result } = renderHook(() => useMockLending());
    await act(async () => {
      result.current.deposit('SOL-001', 'Solar Farm', 1000);
      await vi.advanceTimersByTimeAsync(1000);
    });
    await act(async () => {
      result.current.deposit('SOL-001', 'Solar Farm', 500);
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data[0].amountInvested).toBe(1500);
    expect(result.current.data[0].lpTokens).toBe(1500);
  });

  it('deposit creates separate positions for different projects', async () => {
    const { result } = renderHook(() => useMockLending());
    await act(async () => {
      result.current.deposit('SOL-001', 'Solar Farm', 1000);
      await vi.advanceTimersByTimeAsync(1000);
    });
    await act(async () => {
      result.current.deposit('SOL-002', 'Wind Park', 2000);
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(result.current.data).toHaveLength(2);
    expect(result.current.data[0].projectId).toBe('SOL-001');
    expect(result.current.data[1].projectId).toBe('SOL-002');
  });

  it('withdraw reduces position amount', async () => {
    const { result } = renderHook(() => useMockLending());
    await act(async () => {
      result.current.deposit('SOL-001', 'Solar Farm', 1000);
      await vi.advanceTimersByTimeAsync(1000);
    });
    await act(async () => {
      result.current.withdraw('SOL-001', 300);
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(result.current.data[0].amountInvested).toBe(700);
    expect(result.current.data[0].lpTokens).toBe(700);
  });

  it('withdraw removes position when amount reaches zero', async () => {
    const { result } = renderHook(() => useMockLending());
    await act(async () => {
      result.current.deposit('SOL-001', 'Solar Farm', 500);
      await vi.advanceTimersByTimeAsync(1000);
    });
    await act(async () => {
      result.current.withdraw('SOL-001', 500);
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(result.current.data).toHaveLength(0);
  });

  it('claimRewards resets earnedYield to 0', async () => {
    const { result } = renderHook(() => useMockLending());
    await act(async () => {
      result.current.deposit('SOL-001', 'Solar Farm', 1000);
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(result.current.data[0].earnedYield).toBeGreaterThan(0);

    await act(async () => {
      result.current.claimRewards('SOL-001');
      await vi.advanceTimersByTimeAsync(800);
    });
    expect(result.current.data[0].earnedYield).toBe(0);
  });

  it('deposit generates apy, currentValue, and earnedYield', async () => {
    const { result } = renderHook(() => useMockLending());
    await act(async () => {
      result.current.deposit('SOL-001', 'Solar Farm', 1000);
      await vi.advanceTimersByTimeAsync(1000);
    });
    const p = result.current.data[0];
    expect(p.apy).toBeGreaterThan(0);
    expect(p.currentValue).toBeGreaterThan(0);
    expect(p.earnedYield).toBeGreaterThan(0);
  });

  it('mutate function exists and does not throw', () => {
    const { result } = renderHook(() => useMockLending());
    expect(() => result.current.mutate()).not.toThrow();
  });
});
