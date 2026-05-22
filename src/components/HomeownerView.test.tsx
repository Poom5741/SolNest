import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import HomeownerView from './HomeownerView';
import { ToastProvider } from './Toast';
import type { LoanDetails, EnergyTelemetry, InverterData } from '../types';

const mockLoan: LoanDetails = {
  totalLoanAmount: 24000,
  remainingBalance: 18500,
  monthlyPayment: 550,
  paymentsMade: 4,
  totalPayments: 48,
  nextPaymentDate: '2026-06-15',
};

const mockTelemetry: EnergyTelemetry = {
  daily: [
    { day: 'Mon', kwh: 45.2 },
    { day: 'Tue', kwh: 42.8 },
    { day: 'Wed', kwh: 48.1 },
    { day: 'Thu', kwh: 44.5 },
    { day: 'Fri', kwh: 46.3 },
    { day: 'Sat', kwh: 40.1 },
    { day: 'Sun', kwh: 38.9 },
  ],
  weekly: [
    { week: 'W1', kwh: 305 },
    { week: 'W2', kwh: 298 },
    { week: 'W3', kwh: 312 },
    { week: 'W4', kwh: 290 },
  ],
  monthly: [
    { month: 'Jan', kwh: 1200 },
    { month: 'Feb', kwh: 1150 },
    { month: 'Mar', kwh: 1280 },
  ],
};

const mockInverter: InverterData = {
  status: 'Online',
  dailyYield: 11.9,
  totalYield: 15420,
  temperature: 42.5,
  efficiency: 98.1,
};

const defaultProps = {
  loan: mockLoan,
  telemetry: mockTelemetry,
  inverter: mockInverter,
  lang: 'en' as const,
  onRepayment: vi.fn().mockResolvedValue(true),
};

function renderWithProviders(ui: React.ReactElement) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

describe('HomeownerView', () => {
  it('renders the loan dashboard heading', () => {
    renderWithProviders(<HomeownerView {...defaultProps} />);
    expect(screen.getByText('Loan Dashboard')).toBeInTheDocument();
  });

  it('displays total loan amount with currency formatting', () => {
    renderWithProviders(<HomeownerView {...defaultProps} />);
    expect(screen.getByText(/\$24,000\.00/)).toBeInTheDocument();
  });

  it('displays remaining balance (appears in card and payment section)', () => {
    renderWithProviders(<HomeownerView {...defaultProps} />);
    const matches = screen.getAllByText(/\$18,500\.00/);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('displays monthly payment (appears in card and payment section)', () => {
    renderWithProviders(<HomeownerView {...defaultProps} />);
    const matches = screen.getAllByText(/\$550\.00/);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('shows payment progress', () => {
    renderWithProviders(<HomeownerView {...defaultProps} />);
    expect(screen.getByText(/4\/48/)).toBeInTheDocument();
  });

  it('renders energy production section', () => {
    renderWithProviders(<HomeownerView {...defaultProps} />);
    expect(screen.getByText('Energy Production')).toBeInTheDocument();
  });

  it('shows inverter status as Online', () => {
    renderWithProviders(<HomeownerView {...defaultProps} />);
    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  it('shows inverter efficiency', () => {
    renderWithProviders(<HomeownerView {...defaultProps} />);
    expect(screen.getByText(/98\.1/)).toBeInTheDocument();
  });

  it('renders make payment button (label and button both show text)', () => {
    renderWithProviders(<HomeownerView {...defaultProps} />);
    const matches = screen.getAllByText('Make Payment');
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('calls onRepayment when make payment clicked', async () => {
    const onRepayment = vi.fn().mockResolvedValue(true);
    renderWithProviders(<HomeownerView {...defaultProps} onRepayment={onRepayment} />);
    const buttons = screen.getAllByText('Make Payment');
    await act(async () => {
      fireEvent.click(buttons[buttons.length - 1]);
    });
    expect(onRepayment).toHaveBeenCalled();
  });

  it('renders energy section even when telemetry is null', () => {
    renderWithProviders(<HomeownerView {...defaultProps} telemetry={null} />);
    // Energy section heading always renders
    expect(screen.getByText('Energy Production')).toBeInTheDocument();
  });
});
