import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

const mockWriteContractAsync = vi.fn();
const mockRefetch = vi.fn();

let mockNextListingId: bigint | undefined = BigInt(3);
let mockFeeBps: bigint | undefined = BigInt(250);
let mockListingsData: { result: unknown }[] = [];
let mockLpAllowance: bigint | undefined = BigInt(0);
let mockUsdcAllowance: bigint | undefined = BigInt(0);
let mockAccountAddress: `0x${string}` | undefined = "0x1234567890123456789012345678901234567890";

vi.mock("wagmi", () => ({
  useAccount: () => ({ address: mockAccountAddress }),
  useReadContract: (config: { functionName: string }) => {
    if (config.functionName === "nextListingId") {
      return { data: mockNextListingId, refetch: mockRefetch };
    }
    if (config.functionName === "feeBasisPoints") {
      return { data: mockFeeBps };
    }
    if (config.functionName === "allowance") {
      // Differentiate LP vs USDC allowance by the address used
      if ((config as { address?: string }).address === "0x5FbDB2315678afecb367f032d93F642f64180aa3") {
        return { data: mockUsdcAllowance, refetch: mockRefetch };
      }
      return { data: mockLpAllowance };
    }
    return { data: undefined, refetch: mockRefetch };
  },
  useReadContracts: () => ({
    data: mockListingsData,
    refetch: mockRefetch,
    isLoading: false,
  }),
  useWriteContract: () => ({
    writeContractAsync: mockWriteContractAsync,
    data: undefined,
  }),
  useWaitForTransactionReceipt: () => ({ isLoading: false }),
}));

// Must import after mocks
const { default: useRealSecondaryMarket } = await import("./useRealSecondaryMarket");

function makeListing(
  id: number,
  seller: string,
  tokenContract: string,
  amount: bigint,
  price: bigint,
  expiresAt: bigint,
  active: boolean,
) {
  return {
    result: [BigInt(id), seller, tokenContract, amount, price, expiresAt, active] as const,
  };
}

const futureTimestamp = BigInt(Math.floor(Date.now() / 1000) + 7 * 86400);
const pastTimestamp = BigInt(Math.floor(Date.now() / 1000) - 2 * 86400);

describe("useRealSecondaryMarket", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNextListingId = BigInt(3);
    mockFeeBps = BigInt(250);
    mockLpAllowance = BigInt(0);
    mockUsdcAllowance = BigInt(0);
    mockAccountAddress = "0x1234567890123456789012345678901234567890";
    mockListingsData = [
      makeListing(
        0,
        "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        "0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB",
        BigInt(1000 * 1_000_000),
        BigInt(1050 * 1_000_000),
        futureTimestamp,
        true,
      ),
      makeListing(
        1,
        "0x1234567890123456789012345678901234567890",
        "0xCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC",
        BigInt(500 * 1_000_000),
        BigInt(525 * 1_000_000),
        futureTimestamp,
        true,
      ),
      makeListing(
        2,
        "0xDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
        "0xEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE",
        BigInt(2000 * 1_000_000),
        BigInt(2100 * 1_000_000),
        pastTimestamp,
        true,
      ),
    ];
  });

  it("returns listings array from contract data", () => {
    const { result } = renderHook(() =>
      useRealSecondaryMarket("0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"),
    );
    expect(result.current.data.length).toBeGreaterThan(0);
  });

  it("filters myListings by wallet address", () => {
    const { result } = renderHook(() =>
      useRealSecondaryMarket("0x1234567890123456789012345678901234567890"),
    );
    expect(result.current.myListings.length).toBe(1);
    expect(result.current.myListings[0].seller.toLowerCase()).toBe(
      "0x1234567890123456789012345678901234567890",
    );
  });

  it("myListings is empty for non-matching wallet", () => {
    const { result } = renderHook(() =>
      useRealSecondaryMarket("0x9999999999999999999999999999999999999999"),
    );
    expect(result.current.myListings).toHaveLength(0);
  });

  it("marks expired listings with status expired", () => {
    const { result } = renderHook(() =>
      useRealSecondaryMarket("0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"),
    );
    const expiredListing = result.current.data.find(
      (l) => l.status === "expired",
    );
    expect(expiredListing).toBeDefined();
    expect(expiredListing!.listingId).toBe(2);
  });

  it("marks sold listings when active is false", () => {
    mockListingsData = [
      makeListing(
        0,
        "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        "0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB",
        BigInt(1000 * 1_000_000),
        BigInt(1050 * 1_000_000),
        futureTimestamp,
        false,
      ),
    ];
    const { result } = renderHook(() =>
      useRealSecondaryMarket("0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"),
    );
    // sold listings should be filtered out of main data (only active/expired shown)
    expect(result.current.data.find((l) => l.listingId === 0)).toBeUndefined();
  });

  it("buyListing calls writeContractAsync with correct args", async () => {
    mockWriteContractAsync.mockResolvedValue("0xTxHash");
    const { result } = renderHook(() =>
      useRealSecondaryMarket("0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"),
    );

    await act(async () => {
      await result.current.buyListing("LST-001");
    });

    expect(mockWriteContractAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        functionName: "buy",
        args: [BigInt(1)],
      }),
    );
  });

  it("buyListing returns true on success", async () => {
    mockWriteContractAsync.mockResolvedValue("0xTxHash");
    const { result } = renderHook(() =>
      useRealSecondaryMarket("0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"),
    );

    let ok: boolean = false;
    await act(async () => {
      ok = await result.current.buyListing("LST-000");
    });

    expect(ok).toBe(true);
  });

  it("cancelListing calls writeContractAsync with cancel function", async () => {
    mockWriteContractAsync.mockResolvedValue("0xTxHash");
    const { result } = renderHook(() =>
      useRealSecondaryMarket("0x1234567890123456789012345678901234567890"),
    );

    await act(async () => {
      await result.current.cancelListing(1);
    });

    expect(mockWriteContractAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        functionName: "cancel",
        args: [BigInt(1)],
      }),
    );
  });

  it("createListing calls writeContractAsync with list function", async () => {
    mockWriteContractAsync.mockResolvedValue("0xTxHash");
    const { result } = renderHook(() =>
      useRealSecondaryMarket("0x1234567890123456789012345678901234567890"),
    );

    await act(async () => {
      await result.current.createListing(
        "0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB",
        "Test Project",
        500,
        525,
        "0x1234567890123456789012345678901234567890",
        14,
      );
    });

    expect(mockWriteContractAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        functionName: "list",
        args: [
          "0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB",
          BigInt(500 * 1_000_000),
          BigInt(525 * 1_000_000),
          BigInt(14),
        ],
      }),
    );
  });

  it("needsApproval is true when LP allowance is zero", () => {
    mockLpAllowance = BigInt(0);
    const { result } = renderHook(() =>
      useRealSecondaryMarket("0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"),
    );
    expect(result.current.needsApproval).toBe(true);
  });

  it("needsApproval is false when LP allowance is positive", () => {
    mockLpAllowance = BigInt(1000 * 1_000_000);
    const { result } = renderHook(() =>
      useRealSecondaryMarket("0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"),
    );
    expect(result.current.needsApproval).toBe(false);
  });

  it("needsUsdcApproval is true when USDC allowance is zero", () => {
    mockUsdcAllowance = BigInt(0);
    const { result } = renderHook(() =>
      useRealSecondaryMarket("0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"),
    );
    expect(result.current.needsUsdcApproval).toBe(true);
  });

  it("needsUsdcApproval is false when USDC allowance is positive", () => {
    mockUsdcAllowance = BigInt(5000 * 1_000_000);
    const { result } = renderHook(() =>
      useRealSecondaryMarket("0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"),
    );
    expect(result.current.needsUsdcApproval).toBe(false);
  });

  it("approveLpTokens calls writeContractAsync with approve", async () => {
    mockWriteContractAsync.mockResolvedValue("0xTxHash");
    const { result } = renderHook(() =>
      useRealSecondaryMarket("0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"),
    );

    let ok = false;
    await act(async () => {
      ok = await result.current.approveLpTokens(
        "0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB",
        1000,
      );
    });

    expect(ok).toBe(true);
    expect(mockWriteContractAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        functionName: "approve",
        address: "0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB",
      }),
    );
  });

  it("approveUsdc calls writeContractAsync with USDC approve", async () => {
    mockWriteContractAsync.mockResolvedValue("0xTxHash");
    const { result } = renderHook(() =>
      useRealSecondaryMarket("0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"),
    );

    let ok = false;
    await act(async () => {
      ok = await result.current.approveUsdc(2000);
    });

    expect(ok).toBe(true);
    expect(mockWriteContractAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        functionName: "approve",
      }),
    );
  });

  it("returns isLoading false when not loading", () => {
    const { result } = renderHook(() =>
      useRealSecondaryMarket("0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"),
    );
    expect(result.current.isLoading).toBe(false);
  });

  it("returns error as null", () => {
    const { result } = renderHook(() =>
      useRealSecondaryMarket("0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"),
    );
    expect(result.current.error).toBeNull();
  });

  it("returns empty listings when no contract data", () => {
    mockListingsData = [];
    mockNextListingId = BigInt(0);
    const { result } = renderHook(() =>
      useRealSecondaryMarket("0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"),
    );
    expect(result.current.data).toHaveLength(0);
    expect(result.current.myListings).toHaveLength(0);
  });

  it("listings have expected shape", () => {
    const { result } = renderHook(() =>
      useRealSecondaryMarket("0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"),
    );
    const listing = result.current.data[0];
    expect(listing).toHaveProperty("id");
    expect(listing).toHaveProperty("projectId");
    expect(listing).toHaveProperty("projectName");
    expect(listing).toHaveProperty("amount");
    expect(listing).toHaveProperty("price");
    expect(listing).toHaveProperty("seller");
    expect(listing).toHaveProperty("createdAt");
    expect(listing).toHaveProperty("status");
    expect(listing).toHaveProperty("listingId");
    expect(listing).toHaveProperty("tokenContract");
    expect(listing).toHaveProperty("fee");
    expect(listing).toHaveProperty("expirationDate");
  });

  it("buyListing does nothing when address is undefined", async () => {
    mockAccountAddress = undefined;
    const { result } = renderHook(() =>
      useRealSecondaryMarket("0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"),
    );

    let ok: boolean = true;
    await act(async () => {
      ok = await result.current.buyListing("LST-001");
    });

    expect(ok).toBe(false);
    expect(mockWriteContractAsync).not.toHaveBeenCalled();
  });

  it("createListing does nothing when address is undefined", async () => {
    mockAccountAddress = undefined;
    const { result } = renderHook(() =>
      useRealSecondaryMarket("0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"),
    );

    await act(async () => {
      await result.current.createListing(
        "0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB",
        "Test",
        500,
        525,
        "0x1234567890123456789012345678901234567890",
      );
    });

    expect(mockWriteContractAsync).not.toHaveBeenCalled();
  });

  it("listing amounts are converted from contract decimals", () => {
    const { result } = renderHook(() =>
      useRealSecondaryMarket("0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"),
    );
    const listing = result.current.data[0];
    expect(listing.amount).toBe(1000);
    expect(listing.price).toBe(1050);
  });

  it("mutate triggers refetch", () => {
    const { result } = renderHook(() =>
      useRealSecondaryMarket("0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"),
    );
    act(() => {
      result.current.mutate();
    });
    expect(mockRefetch).toHaveBeenCalled();
  });

  it("refresh triggers refetch", () => {
    const { result } = renderHook(() =>
      useRealSecondaryMarket("0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"),
    );
    act(() => {
      result.current.refresh();
    });
    expect(mockRefetch).toHaveBeenCalled();
  });
});
