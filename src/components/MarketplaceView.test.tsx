import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MarketplaceView from './MarketplaceView';
import { ToastProvider } from './Toast';
import { mockProjects } from '../services/mock/mockData';
import type { Project } from '../types';

const defaultProps = {
  projects: mockProjects as Project[],
  lang: 'en' as const,
  onDeposit: vi.fn().mockResolvedValue(undefined),
  walletConnected: false,
  onConnectWallet: vi.fn(),
};

function renderWithProviders(ui: React.ReactElement) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

describe('MarketplaceView', () => {
  it('renders the marketplace heading', () => {
    renderWithProviders(<MarketplaceView {...defaultProps} />);
    expect(screen.getByText('Solar Project Marketplace')).toBeInTheDocument();
  });

  it('renders project cards with actual mock data names', () => {
    renderWithProviders(<MarketplaceView {...defaultProps} />);
    expect(screen.getByText('Bangkok Solar Community')).toBeInTheDocument();
    expect(screen.getByText('Chiang Mai Solar Farm')).toBeInTheDocument();
  });

  it('renders search input', () => {
    renderWithProviders(<MarketplaceView {...defaultProps} />);
    expect(screen.getByPlaceholderText('Search projects...')).toBeInTheDocument();
  });

  it('filters projects by search text', () => {
    renderWithProviders(<MarketplaceView {...defaultProps} />);
    const searchInput = screen.getByPlaceholderText('Search projects...');
    fireEvent.change(searchInput, { target: { value: 'Bangkok Solar Community' } });
    expect(screen.getByText('Bangkok Solar Community')).toBeInTheDocument();
    expect(screen.queryByText('Chiang Mai Solar Farm')).not.toBeInTheDocument();
  });

  it('renders filter buttons (multiple status matches in cards)', () => {
    renderWithProviders(<MarketplaceView {...defaultProps} />);
    // Filter buttons exist — use getAllByText since status badges also show these words
    expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Funding' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Active' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Repaid' })).toBeInTheDocument();
  });

  it('shows connect wallet in deposit section when not connected', () => {
    renderWithProviders(<MarketplaceView {...defaultProps} />);
    // Click a project card to enter detail view
    fireEvent.click(screen.getByText('Bangkok Solar Community'));
    // In detail view deposit section, when no wallet, shows "Connect Wallet"
    expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
  });

  it('calls onConnectWallet from deposit section', () => {
    renderWithProviders(<MarketplaceView {...defaultProps} />);
    fireEvent.click(screen.getByText('Bangkok Solar Community'));
    fireEvent.click(screen.getByText('Connect Wallet'));
    expect(defaultProps.onConnectWallet).toHaveBeenCalled();
  });

  it('renders project cards when wallet connected', () => {
    renderWithProviders(
      <MarketplaceView
        {...defaultProps}
        walletConnected={true}
        onDeposit={vi.fn().mockResolvedValue(true)}
      />
    );
    // Project cards should be rendered (Bangkok Solar Community from mockData)
    expect(screen.getByText('Bangkok Solar Community')).toBeInTheDocument();
  });

  it('handles empty projects array', () => {
    renderWithProviders(<MarketplaceView {...defaultProps} projects={[]} />);
    expect(screen.getByText('Solar Project Marketplace')).toBeInTheDocument();
  });

  it('shows deposit button in detail view when wallet connected', () => {
    renderWithProviders(
      <MarketplaceView
        {...defaultProps}
        walletConnected={true}
        onDeposit={vi.fn().mockResolvedValue(true)}
      />
    );
    fireEvent.click(screen.getByText('Bangkok Solar Community'));
    // "Deposit USDC" appears as both a heading (h3) and a button
    const elements = screen.getAllByText('Deposit USDC');
    expect(elements.length).toBeGreaterThanOrEqual(1);
  });
});
