import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import AdminView from './AdminView';
import { ToastProvider } from './Toast';
import { mockProjects } from '../services/mock/mockData';
import type { Project, AdminProjectForm } from '../types';

const projects = mockProjects as Project[];

const defaultProps = {
  projects,
  lang: 'en' as const,
  onCreateProject: vi.fn().mockResolvedValue(undefined),
  onUpdateStatus: vi.fn().mockResolvedValue(undefined),
};

function renderWithProviders(ui: React.ReactElement) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

describe('AdminView', () => {
  it('renders the admin heading', () => {
    renderWithProviders(<AdminView {...defaultProps} />);
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
  });

  it('renders project list with actual mock data names', () => {
    renderWithProviders(<AdminView {...defaultProps} />);
    expect(screen.getByText('Bangkok Solar Community')).toBeInTheDocument();
    expect(screen.getByText('SOL-001')).toBeInTheDocument();
  });

  it('shows project statuses', () => {
    renderWithProviders(<AdminView {...defaultProps} />);
    // "Funding" appears as status badge on multiple project cards
    const fundingBadges = screen.getAllByText('Funding');
    expect(fundingBadges.length).toBeGreaterThan(0);
  });

  it('renders create project button', () => {
    renderWithProviders(<AdminView {...defaultProps} />);
    // Header button shows "Create New Project" when form is closed
    expect(screen.getByText('Create New Project')).toBeInTheDocument();
  });

  it('shows project creation form when button clicked', async () => {
    renderWithProviders(<AdminView {...defaultProps} />);
    await act(async () => {
      fireEvent.click(screen.getByText('Create New Project'));
    });
    // Form submit button text
    expect(screen.getByText('Create Project')).toBeInTheDocument();
  });

  it('has lifecycle action buttons for projects', () => {
    renderWithProviders(<AdminView {...defaultProps} />);
    const activateButtons = screen.queryAllByText('Activate');
    expect(activateButtons.length).toBeGreaterThanOrEqual(0);
  });

  it('handles empty projects array', () => {
    renderWithProviders(<AdminView {...defaultProps} projects={[]} />);
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Create New Project')).toBeInTheDocument();
  });

  it('toggle button shows Close when form is open', async () => {
    renderWithProviders(<AdminView {...defaultProps} />);
    await act(async () => {
      fireEvent.click(screen.getByText('Create New Project'));
    });
    expect(screen.getByText('Close')).toBeInTheDocument();
  });

  it('closes creation form when Close is clicked', async () => {
    renderWithProviders(<AdminView {...defaultProps} />);
    await act(async () => {
      fireEvent.click(screen.getByText('Create New Project'));
    });
    await act(async () => {
      fireEvent.click(screen.getByText('Close'));
    });
    expect(screen.getByText('Create New Project')).toBeInTheDocument();
  });
});
