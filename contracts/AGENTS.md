# contracts/ — Smart Contract Agent Instructions

> Inherits from root `AGENTS.md`. Root conventions (TDG, TypeScript strict, commits) apply here.
> This directory is a standalone Hardhat project with its own `package.json` and `tsconfig.json`.

## Project Stack
- **Blockchain**: Ethereum / EVM-compatible
- **Framework**: Hardhat 2.22+ (`@nomicfoundation/hardhat-toolbox`)
- **Language**: Solidity 0.8.24, TypeScript ~5.8 (commonjs)
- **Library**: OpenZeppelin Contracts 5.0
- **Testing**: Hardhat test runner (Mocha + Chai)
- **Types**: TypeChain (auto-generated in `typechain-types/`)

---

## Commands

| Command | Action |
|---------|--------|
| `npm run compile` | Compile Solidity contracts |
| `npm test` | Run contract tests |
| `npm run deploy:sepolia` | Deploy to Sepolia testnet |
| `npm run export-abis` | Export ABIs to `src/abis/` |

---

## Solidity Conventions

### Solidity Version
All contracts use **Solidity 0.8.24** with optimizer enabled (200 runs).

### Contract Patterns

**Factory Pattern**: `ProjectMarketFactory` deploys `ProjectMarket` instances via `new ProjectMarket(...)`. The factory maintains an on-chain registry of deployed projects.

**Struct Storage**: Project metadata stored as structs with explicit fields:
```solidity
ProjectInfo private _project;
mapping(address => InvestorInfo) private _investors;
```

**Custom Errors** (preferred over string reverts for gas efficiency):
```solidity
error InvalidStatus();
error NotHomeowner();
error ZeroAmount();
error InsufficientBalance();
error TransferFailed();
```

**Modifiers** for access control and state validation:
```solidity
modifier onlyStatus(ProjectStatus expected) {
    if (_currentStatus != expected) revert InvalidStatus();
    _;
}

modifier onlyHomeowner() {
    if (msg.sender != _project.homeowner) revert NotHomeowner();
    _;
}

modifier onlyAdmin() {
    if (!hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) revert NotAdmin();
    _;
}
```

### OpenZeppelin Usage

| Contract | Purpose |
|----------|---------|
| `ERC20` | LP token representing project shares |
| `AccessControl` | Role-based permissions (`DEFAULT_ADMIN_ROLE`, `LIFECYCLE_ROLE`) |
| `ReentrancyGuard` | Prevent reentrancy attacks on fund flows |
| `SafeERC20` | Safe USDC transfers (handles non-standard ERC20) |
| `IERC20` | USDC interface |

**Import pattern**:
```solidity
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
```

### Interface Segregation

Define interfaces in `contracts/interfaces/`:
```
contracts/interfaces/
├── IProjectMarket.sol
└── IProjectMarketFactory.sol
```

Contracts implement their interface: `contract ProjectMarket is IProjectMarket, ERC20, AccessControl, ReentrancyGuard`

---

## State Machine

Projects follow a lifecycle managed by `ProjectStatus` enum. Status transitions are guarded:
- Only the `LIFECYCLE_ROLE` can advance project status
- Status-specific operations gated by `onlyStatus(...)` modifier
- Immutable references: `usdc` and `factory` addresses set at construction

---

## Deployment

**Sepolia** (testnet): `npm run deploy:sepolia`
- Requires `.env` with `SEPOLIA_RPC_URL` and `PRIVATE_KEY`
- Uses `dotenv` for env var loading in `hardhat.config.ts`

---

## TypeChain Integration

After compilation, TypeChain generates TypeScript type bindings in `contracts/typechain-types/`.
These are consumed by the frontend (`src/abis/` + type imports).

**Do NOT edit `typechain-types/` manually** — it is auto-generated from Solidity compilation.

### ABI Export

`scripts/export-abis.js` copies compiled ABI JSON files to `src/abis/` for frontend consumption.

---

## Testing

Test files in `contracts/test/`:
```
contracts/test/
├── ProjectMarket.test.ts
└── ProjectMarketFactory.test.ts
```

- Hardhat test runner (Mocha + Chai)
- Run all: `npm test` (from `contracts/` directory)
- Use Hardhat's built-in network for local testing
- Deploy factory → create project → test lifecycle transitions and fund flows

---

## File Structure

```
contracts/
├── contracts/                  # Solidity source
│   ├── ProjectMarket.sol       # Core project contract (ERC20 LP token)
│   ├── ProjectMarketFactory.sol # Factory deploying project instances
│   ├── interfaces/             # Solidity interfaces
│   │   ├── IProjectMarket.sol
│   │   └── IProjectMarketFactory.sol
│   └── mocks/                  # Test mocks (e.g., MockUSDC.sol)
├── scripts/
│   ├── deploy.ts               # Deployment script
│   └── export-abis.js          # ABI export to src/abis/
├── test/                       # Contract tests
├── typechain-types/            # Auto-generated TypeScript bindings (do not edit)
├── hardhat.config.ts           # Hardhat configuration
├── package.json                # Standalone project dependencies
└── tsconfig.json               # Separate TS config (commonjs, ES2020)
```
