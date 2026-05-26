import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMockSecondaryMarket } from './useMockSecondaryMarket';

describe('useMockSecondaryMarket', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns initial listings from mockData', () => {
    const { result } = renderHook(() =>
      useMockSecondaryMarket('0xTestWallet')
    );
    expect(result.current.data.length).toBeGreaterThan(0);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('listings have expected shape', () => {
    const { result } = renderHook(() =>
      useMockSecondaryMarket('0xTestWallet')
    );
    const listing = result.current.data[0];
    expect(listing).toHaveProperty('id');
    expect(listing).toHaveProperty('projectId');
    expect(listing).toHaveProperty('projectName');
    expect(listing).toHaveProperty('amount');
    expect(listing).toHaveProperty('price');
    expect(listing).toHaveProperty('seller');
    expect(listing).toHaveProperty('createdAt');
  });

  it('listings include extended escrow fields', () => {
    const { result } = renderHook(() =>
      useMockSecondaryMarket('0xTestWallet')
    );
    const listing = result.current.data[0];
    expect(listing).toHaveProperty('expirationDate');
    expect(typeof listing.expirationDate).toBe('number');
    expect(listing).toHaveProperty('status');
    expect(['active', 'expired', 'cancelled', 'sold']).toContain(listing.status);
    expect(listing).toHaveProperty('fee');
    expect(typeof listing.fee).toBe('number');
    expect(listing).toHaveProperty('listingId');
    expect(typeof listing.listingId).toBe('number');
  });

  it('cancelListing sets listing status to cancelled', () => {
    const { result } = renderHook(() =>
      useMockSecondaryMarket('0xTestWallet')
    );
    const targetListingId = result.current.data[0].listingId!;
    act(() => {
      result.current.cancelListing(targetListingId);
    });
    const updated = result.current.data.find(l => l.listingId === targetListingId);
    expect(updated?.status).toBe('cancelled');
  });

  it('createListing includes extended fields', () => {
    const { result } = renderHook(() =>
      useMockSecondaryMarket('0xTestWallet')
    );
    act(() => {
      result.current.createListing('SOL-010', 'Test Project', 200, 210, '0xSeller', 14);
    });
    const added = result.current.data[result.current.data.length - 1];
    expect(added.expirationDate).toBeDefined();
    expect(added.status).toBe('active');
    expect(added.fee).toBe(250);
    expect(added.listingId).toBeDefined();
    expect(added.durationDays).toBe(14);
  });

  it('myListings filters by wallet address', () => {
    const { result } = renderHook(() =>
      useMockSecondaryMarket('0xTestWallet')
    );
    const myListings = result.current.myListings;
    const allMatch = myListings.every(
      (l) => l.seller === '0xTestWallet'
    );
    expect(allMatch).toBe(true);
  });

  it('myListings is empty for unknown wallet', () => {
    const { result } = renderHook(() =>
      useMockSecondaryMarket('0xUnknownWallet')
    );
    expect(result.current.myListings).toHaveLength(0);
  });

  it('buyListing removes listing by id', async () => {
    const { result } = renderHook(() =>
      useMockSecondaryMarket('0xTestWallet')
    );
    const initialLength = result.current.data.length;
    const targetId = result.current.data[0].id;

    await act(async () => {
      result.current.buyListing(targetId);
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(result.current.data).toHaveLength(initialLength - 1);
    expect(
      result.current.data.find((l) => l.id === targetId)
    ).toBeUndefined();
  });

  it('buyListing sets isLoading during operation', async () => {
    const { result } = renderHook(() =>
      useMockSecondaryMarket('0xTestWallet')
    );
    const targetId = result.current.data[0].id;

    await act(async () => {
      result.current.buyListing(targetId);
    });
    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(result.current.isLoading).toBe(false);
  });

  it('createListing adds a new listing', () => {
    const { result } = renderHook(() =>
      useMockSecondaryMarket('0xTestWallet')
    );
    const initialLength = result.current.data.length;

    act(() => {
      result.current.createListing(
        'SOL-009',
        'New Solar Farm',
        500,
        450,
        '0xSeller'
      );
    });

    expect(result.current.data).toHaveLength(initialLength + 1);
    const added = result.current.data[result.current.data.length - 1];
    expect(added.projectId).toBe('SOL-009');
    expect(added.projectName).toBe('New Solar Farm');
    expect(added.amount).toBe(500);
    expect(added.price).toBe(450);
    expect(added.seller).toBe('0xSeller');
  });

  it('createListing generates listing id with LST prefix', () => {
    const { result } = renderHook(() =>
      useMockSecondaryMarket('0xTestWallet')
    );
    act(() => {
      result.current.createListing('SOL-009', 'Farm', 100, 90, '0xSeller');
    });
    const added = result.current.data[result.current.data.length - 1];
    expect(added.id).toMatch(/^LST-\d{3}$/);
  });

  it('mutate sets loading briefly', () => {
    const { result } = renderHook(() =>
      useMockSecondaryMarket('0xTestWallet')
    );
    act(() => {
      result.current.mutate();
      vi.advanceTimersByTime(0);
    });
    expect(result.current.isLoading).toBe(true);
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current.isLoading).toBe(false);
  });
});
