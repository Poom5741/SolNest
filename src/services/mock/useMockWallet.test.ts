import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMockWallet } from './useMockWallet';

describe('useMockWallet', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns initial wallet state connected with USDC balance', () => {
    const { result } = renderHook(() => useMockWallet());

    expect(result.current.data.isConnected).toBe(true);
    expect(result.current.data.address).toBe('0x71C4B...3E4A');
    expect(result.current.data.usdcBalance).toBe(12500);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('disconnects wallet immediately', () => {
    const { result } = renderHook(() => useMockWallet());

    act(() => {
      result.current.disconnect();
    });

    expect(result.current.data.isConnected).toBe(false);
    expect(result.current.data.address).toBe('');
    expect(result.current.data.usdcBalance).toBe(0);
  });

  it('connects wallet with simulated delay', () => {
    const { result } = renderHook(() => useMockWallet());

    act(() => {
      result.current.disconnect();
    });
    expect(result.current.data.isConnected).toBe(false);

    act(() => {
      result.current.connect();
    });
    expect(result.current.isLoading).toBe(true);

    act(() => {
      vi.advanceTimersByTime(800);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data.isConnected).toBe(true);
    expect(result.current.data.address).toMatch(/^0x[A-F0-9]+\.\.\.C251$/);
    expect(result.current.data.usdcBalance).toBe(12500);
  });

  it('updates USDC balance with positive and negative deltas', () => {
    const { result } = renderHook(() => useMockWallet());

    act(() => {
      result.current.updateBalance(1000);
    });
    expect(result.current.data.usdcBalance).toBe(13500);

    act(() => {
      result.current.updateBalance(-500);
    });
    expect(result.current.data.usdcBalance).toBe(13000);
  });

  it('does not allow balance to go below zero', () => {
    const { result } = renderHook(() => useMockWallet());

    act(() => {
      result.current.updateBalance(-20000);
    });
    expect(result.current.data.usdcBalance).toBe(0);
  });

  it('mutate sets loading briefly then resolves', () => {
    const { result } = renderHook(() => useMockWallet());

    act(() => {
      result.current.mutate();
    });
    expect(result.current.isLoading).toBe(true);

    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current.isLoading).toBe(false);
  });
});
