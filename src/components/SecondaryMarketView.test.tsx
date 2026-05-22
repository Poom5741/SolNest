import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import SecondaryMarketView from './SecondaryMarketView';
import { ToastProvider } from './Toast';
import type { SecondaryListing, Project } from '../types';

const mockListings: SecondaryListing[] = [
  {
    id: 'LST-001',
    projectId: 'SOL-001',
    projectName: 'Bangkok Solar Community',
    seller: '0xABCD',
    amount: 1000,
    price: 1050,
    createdAt: '2026-05-20',
  },
  {
    id: 'LST-002',
    projectId: 'SOL-002',
    projectName: 'Chiang Mai Solar Farm',
    seller: '0xEFGH',
    amount: 2500,
    price: 2575,
    createdAt: '2026-05-21',
  },
];

const mockProjects: Project[] = [
  {
    id: 'SOL-001',
    name: 'Bangkok Solar Community',
    location: 'Bangkok, Thailand',
    systemSize: 150,
    targetAmount: 50000,
    fundingProgress: 72,
    apy: 12.5,
    duration: 24,
    risk: 'Low',
    status: 'Funding',
    description: 'Community solar installation',
    image: '',
    installerName: 'Siwasolar EPC',
    investorCount: 142,
    createdAt: '2026-01-15',
  },
];

const defaultProps = {
  listings: mockListings,
  myListings: [] as SecondaryListing[],
  projects: mockProjects,
  lang: 'en' as const,
  walletAddress: '0x71C4B...3E4A',
  onBuy: vi.fn().mockResolvedValue(true),
  onCreateListing: vi.fn(),
};

function renderWithProviders(ui: React.ReactElement) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

describe('SecondaryMarketView', () => {
  it('renders the secondary market heading', () => {
    renderWithProviders(<SecondaryMarketView {...defaultProps} />);
    expect(screen.getByText('LP Token Secondary Market')).toBeInTheDocument();
  });

  it('renders listing cards with actual project names', () => {
    renderWithProviders(<SecondaryMarketView {...defaultProps} />);
    expect(screen.getByText('Bangkok Solar Community')).toBeInTheDocument();
    expect(screen.getByText('Chiang Mai Solar Farm')).toBeInTheDocument();
  });

  it('shows listing prices with USDC / LP suffix', () => {
    renderWithProviders(<SecondaryMarketView {...defaultProps} />);
    expect(screen.getByText('1,050.00 USDC / LP')).toBeInTheDocument();
    expect(screen.getByText('2,575.00 USDC / LP')).toBeInTheDocument();
  });

  it('shows LP token amounts with LP suffix', () => {
    renderWithProviders(<SecondaryMarketView {...defaultProps} />);
    expect(screen.getByText('1,000.00 LP')).toBeInTheDocument();
    expect(screen.getByText('2,500.00 LP')).toBeInTheDocument();
  });

  it('renders Buy buttons for each listing', () => {
    renderWithProviders(<SecondaryMarketView {...defaultProps} />);
    const buyButtons = screen.getAllByText('Buy');
    expect(buyButtons.length).toBe(2);
  });

  it('renders Create Listing button', () => {
    renderWithProviders(<SecondaryMarketView {...defaultProps} />);
    expect(screen.getByText('Create Listing')).toBeInTheDocument();
  });

  it('shows listing counts in headers', () => {
    renderWithProviders(<SecondaryMarketView {...defaultProps} />);
    expect(screen.getByText(/Listings \(2\)/)).toBeInTheDocument();
  });

  it('handles empty listings gracefully', () => {
    renderWithProviders(<SecondaryMarketView {...defaultProps} listings={[]} />);
    expect(screen.getByText('No active listings.')).toBeInTheDocument();
  });

  it('shows my listings section header', () => {
    renderWithProviders(<SecondaryMarketView {...defaultProps} />);
    expect(screen.getByText(/My Listings \(0\)/)).toBeInTheDocument();
  });

  it('shows no my listings message when empty', () => {
    renderWithProviders(<SecondaryMarketView {...defaultProps} />);
    expect(screen.getByText('You have no active listings.')).toBeInTheDocument();
  });
});
