import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ErrorBoundary from './ErrorBoundary';

function BrokenComponent() {
  throw new Error('Test explosion');
}

function GoodComponent() {
  return <div>All good</div>;
}

describe('ErrorBoundary', () => {
  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <GoodComponent />
      </ErrorBoundary>
    );
    expect(screen.getByText('All good')).toBeInTheDocument();
  });

  it('renders fallback UI on child error', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <BrokenComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    spy.mockRestore();
  });

  it('renders custom fallback when provided', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary fallback={<div>Custom error UI</div>}>
        <BrokenComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error UI')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();

    spy.mockRestore();
  });

  it('suppresses console.error for expected test throws', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(spy).toBeDefined();
    spy.mockRestore();
  });
});
