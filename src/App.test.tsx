import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

vi.mock('wagmi', () => ({
  createConfig: () => ({} as Record<string, never>),
  WagmiProvider: ({ children }: { children: React.ReactNode }) => children,
  http: () => ({} as Record<string, never>),
  useAccount: () => ({ address: undefined, isConnected: false }),
  useConnect: () => ({ connect: vi.fn(), connectors: [] }),
  useDisconnect: () => ({ disconnect: vi.fn() }),
  useBalance: () => ({ data: undefined, refetch: vi.fn() }),
  useReadContract: () => ({ data: undefined, refetch: vi.fn(), isLoading: false, error: null }),
  useReadContracts: () => ({ data: undefined, refetch: vi.fn(), isLoading: false, error: null }),
  useWriteContract: () => ({ writeContractAsync: vi.fn(), data: undefined }),
  useWaitForTransactionReceipt: () => ({ isLoading: false }),
}));

vi.mock('@tanstack/react-query', () => ({
  QueryClient: vi.fn(),
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => children,
}));

const localStorageMock = (() => {
  const store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); },
    length: 0,
    key: () => null,
  };
})();
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getAllByText('SolNest').length).toBeGreaterThanOrEqual(2);
  });

  it('renders navigation items', () => {
    render(<App />);
    expect(screen.getByText('Marketplace')).toBeInTheDocument();
    expect(screen.getByText('Portfolio')).toBeInTheDocument();
  });
});
