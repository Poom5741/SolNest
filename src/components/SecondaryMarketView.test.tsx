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
    expirationDate: Math.floor(Date.now() / 1000) + 7 * 86400,
    status: 'active',
    fee: 250,
    listingId: 1,
  },
  {
    id: 'LST-002',
    projectId: 'SOL-002',
    projectName: 'Chiang Mai Solar Farm',
    seller: '0xEFGH',
    amount: 2500,
    price: 2575,
    createdAt: '2026-05-21',
    expirationDate: Math.floor(Date.now() / 1000) + 30 * 86400,
    status: 'active',
    fee: 250,
    listingId: 2,
  },
];

const expiredListing: SecondaryListing = {
  id: 'LST-003',
  projectId: 'SOL-003',
  projectName: 'Phuket Solar Initiative',
  seller: '0xIJKL',
  amount: 500,
  price: 520,
  createdAt: '2026-05-18',
  expirationDate: Math.floor(Date.now() / 1000) - 2 * 86400,
  status: 'expired',
  fee: 250,
  listingId: 3,
};

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
  onCancel: vi.fn().mockResolvedValue(true),
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

  it('shows listing prices with USDC suffix', () => {
    renderWithProviders(<SecondaryMarketView {...defaultProps} />);
    expect(screen.getByText('1,050.00 USDC')).toBeInTheDocument();
    expect(screen.getByText('2,575.00 USDC')).toBeInTheDocument();
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

  it('handles empty listings with empty state copy', () => {
    renderWithProviders(<SecondaryMarketView {...defaultProps} listings={[]} />);
    expect(screen.getByText('No Listings Available')).toBeInTheDocument();
  });

  it('shows my listings section header', () => {
    renderWithProviders(<SecondaryMarketView {...defaultProps} />);
    expect(screen.getByText(/My Listings \(0\)/)).toBeInTheDocument();
  });

  it('shows no my listings message when empty', () => {
    renderWithProviders(<SecondaryMarketView {...defaultProps} />);
    expect(screen.getByText("You haven't listed any LP tokens yet")).toBeInTheDocument();
  });

  it('displays fee percentage on listings', () => {
    renderWithProviders(<SecondaryMarketView {...defaultProps} />);
    const feeElements = screen.getAllByText(/Fee: 2\.5%/);
    expect(feeElements.length).toBe(2);
  });

  it('displays relative expiration time on listings', () => {
    renderWithProviders(<SecondaryMarketView {...defaultProps} />);
    const expirationElements = screen.getAllByText(/Expires in/);
    expect(expirationElements.length).toBeGreaterThan(0);
  });

  it('shows Expired badge for expired listings', () => {
    const listingsWithExpired = [...mockListings, expiredListing];
    renderWithProviders(<SecondaryMarketView {...defaultProps} listings={listingsWithExpired} />);
    const expiredElements = screen.getAllByText('Expired');
    expect(expiredElements.length).toBeGreaterThanOrEqual(1);
  });

  it('does not show Buy button for expired listings', () => {
    renderWithProviders(<SecondaryMarketView {...defaultProps} listings={[expiredListing]} />);
    expect(screen.queryByText('Buy')).not.toBeInTheDocument();
  });

  it('shows loading skeleton when isLoading is true', () => {
    const { container } = renderWithProviders(
      <SecondaryMarketView {...defaultProps} isLoading={true} />
    );
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('sorts listings by listingId', () => {
    const reversedListings = [mockListings[1], mockListings[0]];
    renderWithProviders(<SecondaryMarketView {...defaultProps} listings={reversedListings} />);
    const projectNames = screen.getAllByText(/Solar/);
    expect(projectNames[0].textContent).toContain('Bangkok');
    expect(projectNames[1].textContent).toContain('Chiang Mai');
  });

  it('shows Cancel Listing button on own active listings', () => {
    const myListing: SecondaryListing = {
      ...mockListings[0],
      seller: '0x71C4B...3E4A',
    };
    renderWithProviders(
      <SecondaryMarketView
        {...defaultProps}
        myListings={[myListing]}
      />
    );
    expect(screen.getByText('Cancel Listing')).toBeInTheDocument();
  });

  it('shows cancel confirmation dialog on cancel click', async () => {
    const myListing: SecondaryListing = {
      ...mockListings[0],
      seller: '0x71C4B...3E4A',
    };
    renderWithProviders(
      <SecondaryMarketView
        {...defaultProps}
        myListings={[myListing]}
      />
    );
    await act(async () => {
      fireEvent.click(screen.getByText('Cancel Listing'));
    });
    expect(screen.getByText('Confirm')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('shows Approve USDC button when needsUsdcApproval is true', () => {
    renderWithProviders(
      <SecondaryMarketView {...defaultProps} needsUsdcApproval={true} />
    );
    const approveButtons = screen.getAllByText('Approve USDC');
    expect(approveButtons.length).toBe(2);
  });

  it('shows duration input in create listing form', async () => {
    renderWithProviders(<SecondaryMarketView {...defaultProps} />);
    await act(async () => {
      fireEvent.click(screen.getByText('Create Listing'));
    });
    expect(screen.getByText(/Duration/)).toBeInTheDocument();
  });
});
