import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useMockHomeowner } from './useMockHomeowner';

describe('useMockHomeowner', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns initialized loan with correct values', () => {
    const { result } = renderHook(() => useMockHomeowner());
    expect(result.current.loan).toBeTruthy();
    expect(result.current.loan!.totalLoanAmount).toBe(24000);
    expect(result.current.loan!.remainingBalance).toBe(18500);
    expect(result.current.loan!.nextPaymentDate).toBe('2026-04-15');
    expect(result.current.loan!.paymentsMade).toBe(4);
    expect(result.current.loan!.totalPayments).toBe(48);
    expect(result.current.loan!.monthlyPayment).toBe(550);
  });

  it('returns telemetry with daily, weekly, and monthly arrays', () => {
    const { result } = renderHook(() => useMockHomeowner());
    expect(result.current.telemetry).toBeTruthy();
    expect(result.current.telemetry!.daily).toHaveLength(7);
    expect(result.current.telemetry!.weekly).toHaveLength(4);
    expect(result.current.telemetry!.monthly).toHaveLength(6);

    const days = result.current.telemetry!.daily.map((d) => d.day);
    expect(days).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
    result.current.telemetry!.daily.forEach((d) => {
      expect(typeof d.kwh).toBe('number');
      expect(d.kwh).toBeGreaterThan(0);
    });
  });

  it('returns inverter data with expected fields', () => {
    const { result } = renderHook(() => useMockHomeowner());
    expect(result.current.inverter).toBeTruthy();
    expect(result.current.inverter!.status).toBe('Online');
    expect(typeof result.current.inverter!.dailyYield).toBe('number');
    expect(typeof result.current.inverter!.totalYield).toBe('number');
    expect(typeof result.current.inverter!.temperature).toBe('number');
    expect(typeof result.current.inverter!.efficiency).toBe('number');
    expect(result.current.inverter!.efficiency).toBeGreaterThan(90);
    expect(result.current.inverter!.efficiency).toBeLessThan(100);
  });

  it('initial state has isLoading=false', () => {
    const { result } = renderHook(() => useMockHomeowner());
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('makeRepayment sets isLoading then resolves', async () => {
    const { result } = renderHook(() => useMockHomeowner());
    let promise: Promise<boolean>;
    act(() => {
      promise = result.current.makeRepayment();
    });
    expect(result.current.isLoading).toBe(true);
    await act(async () => {
      vi.advanceTimersByTime(1500);
    });
    const success = await promise!;
    expect(success).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it('mutate regenerates telemetry and inverter data', () => {
    const { result } = renderHook(() => useMockHomeowner());
    const firstDaily = result.current.telemetry!.daily[0].kwh;
    act(() => {
      result.current.mutate();
    });
    const secondDaily = result.current.telemetry!.daily[0].kwh;
    expect(result.current.telemetry!.daily).toHaveLength(7);
    expect(result.current.telemetry!.weekly).toHaveLength(4);
    expect(result.current.telemetry!.monthly).toHaveLength(6);
    expect(result.current.inverter!.status).toBe('Online');
  });

  it('telemetry monthly array contains correct month labels', () => {
    const { result } = renderHook(() => useMockHomeowner());
    const months = result.current.telemetry!.monthly.map((m) => m.month);
    expect(months).toHaveLength(6);
    months.forEach((m) => {
      expect(typeof m).toBe('string');
      expect(m.length).toBeGreaterThan(0);
    });
  });
});
