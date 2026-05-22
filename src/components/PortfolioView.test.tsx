import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import PortfolioView from './PortfolioView';
import { ToastProvider } from './Toast';
import type { LendingPosition, PortfolioSummary } from '../types';

const mockPositions: LendingPosition[] = [
  {
    projectId: 'SOL-001',
    projectName: 'Bangkok Solar Community',
    amountInvested: 5000,
    lpTokens: 5000,
    currentValue: 5212.5,
    earnedYield: 212.5,
    apy: 12.5,
    projectStatus: 'Funding',
  },
  {
    projectId: 'SOL-002',
    projectName: 'Chiang Mai Solar Farm',
    amountInvested: 2500,
    lpTokens: 2500,
    currentValue: 2577.5,
    earnedYield: 77.5,
    apy: 14.0,
    projectStatus: 'Funding',
  },
];

const mockSummary: PortfolioSummary = {
  totalInvested: 7500,
  totalEarned: 290,
  activePositions: 2,
  totalLpTokens: 7500,
};

const defaultProps = {
  positions: mockPositions,
  summary: mockSummary,
  lang: 'en' as const,
  onWithdraw: vi.fn().mockResolvedValue(true),
  onClaimRewards: vi.fn().mockResolvedValue(true),
};

function renderWithProviders(ui: React.ReactElement) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

describe('PortfolioView', () => {
  it('renders the portfolio heading', () => {
    renderWithProviders(<PortfolioView {...defaultProps} />);
    expect(screen.getByText('Your Portfolio')).toBeInTheDocument();
  });

  it('displays total invested amount', () => {
    renderWithProviders(<PortfolioView {...defaultProps} />);
    expect(screen.getByText(/\$7,500\.00/)).toBeInTheDocument();
  });

  it('displays total earnings', () => {
    renderWithProviders(<PortfolioView {...defaultProps} />);
    expect(screen.getByText(/\$290\.00/)).toBeInTheDocument();
  });

  it('renders position cards with actual project names', () => {
    renderWithProviders(<PortfolioView {...defaultProps} />);
    expect(screen.getByText('Bangkok Solar Community')).toBeInTheDocument();
    expect(screen.getByText('Chiang Mai Solar Farm')).toBeInTheDocument();
  });

  it('shows total LP tokens in summary cards', () => {
    renderWithProviders(<PortfolioView {...defaultProps} />);
    expect(screen.getByText('7,500.00')).toBeInTheDocument();
  });

  it('handles empty positions', () => {
    renderWithProviders(
      <PortfolioView
        {...defaultProps}
        positions={[]}
        summary={{
          totalInvested: 0,
          totalEarned: 0,
          activePositions: 0,
          totalLpTokens: 0,
        }}
      />
    );
    expect(screen.getByText('No active positions yet. Browse the marketplace to start investing.')).toBeInTheDocument();
  });

  it('shows total LP tokens in summary cards', () => {
    renderWithProviders(<PortfolioView {...defaultProps} />);
    expect(screen.getByText('7,500.00')).toBeInTheDocument();
  });

  it('renders withdraw button for each position', () => {
    renderWithProviders(<PortfolioView {...defaultProps} />);
    const withdrawButtons = screen.getAllByText('Withdraw');
    expect(withdrawButtons.length).toBe(2);
  });

  it('renders claim buttons', () => {
    renderWithProviders(<PortfolioView {...defaultProps} />);
    const claimButtons = screen.getAllByText('Claim');
    expect(claimButtons.length).toBe(2);
  });
});
