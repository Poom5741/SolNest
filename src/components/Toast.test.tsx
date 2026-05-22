import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ToastProvider, useToast } from './Toast';

function ToastTrigger({ type, message }: { type: 'success' | 'error' | 'info'; message: string }) {
  const { addToast } = useToast();
  return <button onClick={() => addToast(type, message)}>Trigger {type}</button>;
}

describe('Toast', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it('renders children within provider', () => {
    render(
      <ToastProvider>
        <div>Child Content</div>
      </ToastProvider>
    );
    expect(screen.getByText('Child Content')).toBeInTheDocument();
  });

  it('throws if useToast is called outside provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    function BadConsumer() {
      useToast();
      return null;
    }
    expect(() => render(<BadConsumer />)).toThrow('useToast must be used within ToastProvider');
    spy.mockRestore();
  });

  it('shows toast message when addToast is called', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(
      <ToastProvider>
        <ToastTrigger type="success" message="Operation completed" />
      </ToastProvider>
    );

    await act(async () => {
      screen.getByText('Trigger success').click();
    });

    expect(screen.getByText('Operation completed')).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('shows error toast message', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(
      <ToastProvider>
        <ToastTrigger type="error" message="Something went wrong" />
      </ToastProvider>
    );

    await act(async () => {
      screen.getByText('Trigger error').click();
    });

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('shows info toast message', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(
      <ToastProvider>
        <ToastTrigger type="info" message="Just so you know" />
      </ToastProvider>
    );

    await act(async () => {
      screen.getByText('Trigger info').click();
    });

    expect(screen.getByText('Just so you know')).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('removes toast after timeout', async () => {
    vi.useFakeTimers();
    render(
      <ToastProvider>
        <ToastTrigger type="info" message="Temporary message" />
      </ToastProvider>
    );

    await act(async () => {
      screen.getByText('Trigger info').click();
      // Advance timers to let the setTimeout callback fire
      vi.advanceTimersByTime(4100);
    });
    expect(screen.queryByText('Temporary message')).toBeNull();
    vi.useRealTimers();
  });

  it('handles multiple toasts simultaneously', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    function MultiToast() {
      const { addToast } = useToast();
      return (
        <button onClick={() => { addToast('success', 'A'); addToast('info', 'B'); }}>
          Trigger
        </button>
      );
    }
    render(<ToastProvider><MultiToast /></ToastProvider>);

    await act(async () => {
      screen.getByText('Trigger').click();
    });

    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
    vi.useRealTimers();
  });
});
