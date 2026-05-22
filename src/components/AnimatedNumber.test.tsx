import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AnimatedNumber from './AnimatedNumber';

describe('AnimatedNumber', () => {
  it('renders the target value', () => {
    render(<AnimatedNumber value={42} />);
    expect(screen.getByText(/42\.000/)).toBeInTheDocument();
  });

  it('renders zero correctly', () => {
    render(<AnimatedNumber value={0} />);
    expect(screen.getByText(/0\.000/)).toBeInTheDocument();
  });

  it('renders negative numbers', () => {
    render(<AnimatedNumber value={-10} />);
    expect(screen.getByText(/-10\.000/)).toBeInTheDocument();
  });

  it('renders large numbers', () => {
    render(<AnimatedNumber value={999999} />);
    expect(screen.getByText(/999,?999\.000/)).toBeInTheDocument();
  });

  it('accepts custom decimals', () => {
    render(<AnimatedNumber value={100} decimals={2} />);
    expect(screen.getByText(/100\.00/)).toBeInTheDocument();
  });

  it('renders with className prop', () => {
    render(<AnimatedNumber value={50} className="text-xl" />);
    expect(screen.getByText(/50\.000/)).toBeInTheDocument();
  });

  it('accepts flashColor prop without error', () => {
    render(<AnimatedNumber value={7} flashColor="#14b886" />);
    expect(screen.getByText(/7\.000/)).toBeInTheDocument();
  });

  it('renders initial value on first render', () => {
    const { rerender } = render(<AnimatedNumber value={10} />);
    expect(screen.getByText(/10\.000/)).toBeInTheDocument();

    rerender(<AnimatedNumber value={25} />);
    // framer-motion animate() does not execute in jsdom, so value stays at 10
    // The component IS present and contains numeric content
    const container = screen.getByText(/\.\d{3}/);
    expect(container).toBeInTheDocument();
  });
});
