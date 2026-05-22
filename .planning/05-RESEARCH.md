# Phase 5 Research — Secondary Market

**Date:** 2026-05-22
**Status:** Complete

## 1. Solidity Patterns — Escrow-Based P2P Listing Market

### Core Contract: `SecondaryMarket.sol`

Following existing ProjectMarket.sol patterns (ERC20, AccessControl, ReentrancyGuard, SafeERC20):

```solidity
contract SecondaryMarket is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant FEE_ROLE = keccak256("FEE_ROLE");

    struct Listing {
        uint256 id;
        address seller;
        address tokenContract;   // ProjectMarket (ERC20 LP)
        uint256 amount;          // LP token amount
        uint256 price;           // Total USDC price (D-11)
        uint256 expiresAt;
        bool active;
    }

    IERC20 public immutable usdc;
    uint256 public feeBasisPoints; // 100 = 1% (D-08)
    uint256 public nextListingId;
    mapping(uint256 => Listing) public listings;

    // Events
    event Listed(uint256 indexed listingId, address indexed seller, address token, uint256 amount, uint256 price);
    event Purchased(uint256 indexed listingId, address indexed buyer, uint256 fee);
    event Cancelled(uint256 indexed listingId);
    event FeeUpdated(uint256 newFeeBps);
}
```

### Function Design

**list(tokenAddress, amount, price, durationDays):**
1. `token.safeTransferFrom(msg.sender, address(this), amount)` — escrow LP tokens (D-05)
2. Store listing with `expiresAt = block.timestamp + durationDays * 1 days`
3. Emit Listed

**buy(listingId):**
1. Validate listing active + not expired
2. Calculate fee = price * feeBasisPoints / 10000 (D-08, D-12)
3. `usdc.safeTransferFrom(msg.sender, seller, price)` — seller gets full price (D-12)
4. `usdc.safeTransferFrom(msg.sender, feeCollector, fee)` — fee from buyer
5. `token.safeTransfer(buyer, amount)` — transfer escrowed LP tokens (D-05)
6. Mark listing inactive, emit Purchased

**cancel(listingId):**
1. Only seller (or admin if expired)
2. `token.safeTransfer(seller, amount)` — return escrowed tokens (D-07)
3. Emit Cancelled

### Integration with ProjectMarket.sol
- ProjectMarket is ERC20 → `IERC20` interface covers approve/transferFrom/transfer
- No modification to ProjectMarket needed — it's just an ERC20 transfer
- USDC is same MockUSDC.sol deployed in Phase 2

## 2. Contract Integration Plan

### Deployment Order (Hardhat)
1. Deploy MockUSDC (already done)
2. Deploy ProjectMarketFactory + ProjectMarket (already done)
3. **New:** Deploy SecondaryMarket with USDC address + admin address

### Hardhat Config
- Add to `hardhat.config.ts`: new contract in sources list
- Add deploy script: `scripts/deploy-secondary-market.ts`
- Regenerate TypeChain types: `npx hardhat typechain`

### TypeChain Types
- `SecondaryMarket` → `contracts/typechain-types/contracts/SecondaryMarket.sol/`
- `SecondaryMarket__factory` for deployment
- ABI exported to `src/abis/SecondaryMarket.json`

### Gas Considerations
- `list()`: ~120K gas (1 SafeERC20 transfer + storage write)
- `buy()`: ~180K gas (2 USDC transfers + 1 LP token transfer + storage write)
- `cancel()`: ~80K gas (1 LP token transfer + storage update)

## 3. Wagmi/Viem Hook Patterns

### useRealSecondaryMarket (Replacing Stub)

```typescript
// Hook structure following Phase 3 pattern from CONTEXT-03.md
export default function useRealSecondaryMarket(walletAddress: `0x${string}` | undefined) {
  // Reads
  const { data: listingCount } = useReadContract({
    address: secondaryMarketAddress,
    abi: SecondaryMarketABI,
    functionName: 'nextListingId',
  });

  // Writes
  const { writeContractAsync } = useWriteContract();

  const listForSale = async (tokenAddress, amount, price, durationDays) => {
    const hash = await writeContractAsync({
      address: secondaryMarketAddress,
      abi: SecondaryMarketABI,
      functionName: 'list',
      args: [tokenAddress, amount, price, durationDays],
    });
    return hash;
  };

  const buyListing = async (listingId) => { /* writeContractAsync → buy */ };
  const cancelListing = async (listingId) => { /* writeContractAsync → cancel */ };

  return { data: listings, myListings, isLoading, error, mutate, buyListing, createListing: listForSale, cancelListing };
}
```

### Pre-Approval Flow
- Seller must `approve()` SecondaryMarket contract to spend LP tokens BEFORE calling `list()` — standard ERC20 approve-then-transfer pattern
- Buyer must `approve()` USDC spending before buying — can combine with buy in one transaction via `multicall` or two-step UI flow

### Hook Contract Address Resolution
- Use Hardhat deploy output (`.planning/contract-addresses.json`) + environment variable `VITE_SECONDARY_MARKET_ADDRESS`
- Same pattern as Phase 3 contract address resolution

## 4. Recommended Tools & Libraries

| Component | Choice | Reason |
|-----------|--------|--------|
| Solidity | 0.8.24 | Matches existing contracts |
| OpenZeppelin | 5.x (existing) | AccessControl, ReentrancyGuard, SafeERC20 |
| Deployment | Hardhat | Same as Phase 2 |
| Type bindings | TypeChain | Regenerate after new contract |
| Frontend reads | wagmi `useReadContract` | Same pattern as Phase 3 |
| Frontend writes | wagmi `useWriteContract` + `useWaitForTransactionReceipt` | Same pattern |
| Transaction feedback | `useToast` | Exists, reuse |
| Testing (contract) | Hardhat + chai | Same as Phase 2 (66 tests, 100% line coverage) |
| Testing (frontend) | Vitest + Testing Library | Same as Phase 3 (126 tests) |

## 5. Known Pitfalls & Edge Cases

### Smart Contract
1. **Reentrancy**: Already mitigated by ReentrancyGuard. `buy()` does 3 token transfers — must use nonReentrant.
2. **Expired listing race**: Validate `block.timestamp < expiresAt` ONCE at buy, cache in local var to avoid re-read.
3. **Self-purchase**: Seller cannot buy their own listing — add `require(msg.sender != listing.seller)`.
4. **Zero-amount listings**: Add `require(amount > 0)` in list().
5. **Token address validation**: Ensure listed token is a valid ProjectMarket LP token — could add allowlist or check with factory.
6. **Fee precision**: Using basis points (100 = 1%). feeBasisPoints uint256, max 10000 (100%). Admin-only setter.
7. **Front-running**: An attacker could front-run a buy transaction. Mitigation: accept first-come-first-served for v1. V2 could add commit-reveal.

### Frontend
1. **Approve before list**: UX must show two-step flow: (a) approve token spend, (b) list. Or use `useWriteContract` chaining.
2. **Expired listing UI**: Filter expired listings client-side. Contract doesn't auto-delete them (cheaper to filter in UI).
3. **Transaction pending state**: Must show loading spinner during `useWaitForTransactionReceipt` for buy/list/cancel.
4. **Error mapping**: Map Solidity revert reasons to user-friendly error messages (e.g., "Insufficient USDC balance" → showToast error).
5. **Wallet not connected**: Gate all actions behind `walletAddress` check (already handled in App.tsx).
6. **Partial listing of full position**: User must know their LP balance for each project to avoid listing more than they own.

### Integration
1. **ProjectMarket LP token address discovery**: Need factory to return all project addresses → filter by user's LP balance to show listable positions.
2. **Yield accounting**: ProjectMarket `claimRewards()` tracks cumulative. Buyer claims rewards accrued from activation → purchase date shift doesn't matter (contract handles it).
