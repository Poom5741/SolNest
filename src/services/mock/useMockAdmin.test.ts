import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMockAdmin } from './useMockAdmin';
import type { Project, ProjectStatus, AdminProjectForm } from '../../types';

const mockForm: AdminProjectForm = {
  name: 'New Solar Project',
  location: 'Bangkok',
  systemSize: 50,
  targetAmount: 500000,
  apy: 14,
  duration: 36,
  risk: 'Medium',
  description: 'A new test solar farm',
  installerName: 'Test Installer Co.',
};

describe('useMockAdmin', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns createProject and updateStatus functions', () => {
    const addProject = vi.fn();
    const updateProjectStatus = vi.fn();
    const { result } = renderHook(() =>
      useMockAdmin(addProject, updateProjectStatus)
    );
    expect(typeof result.current.createProject).toBe('function');
    expect(typeof result.current.updateStatus).toBe('function');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('createProject returns a Project with correct fields', () => {
    const addProject = vi.fn();
    const updateProjectStatus = vi.fn();
    const { result } = renderHook(() =>
      useMockAdmin(addProject, updateProjectStatus)
    );

    let project: Project;
    act(() => {
      project = result.current.createProject(mockForm);
    });

    expect(project!.name).toBe('New Solar Project');
    expect(project!.location).toBe('Bangkok');
    expect(project!.systemSize).toBe(50);
    expect(project!.targetAmount).toBe(500000);
    expect(project!.apy).toBe(14);
    expect(project!.duration).toBe(36);
    expect(project!.risk).toBe('Medium');
    expect(project!.description).toBe('A new test solar farm');
    expect(project!.installerName).toBe('Test Installer Co.');
    expect(project!.status).toBe('Created');
    expect(project!.fundingProgress).toBe(0);
    expect(project!.investorCount).toBe(0);
    expect(project!.id).toMatch(/^SOL-\d{3}$/);
    expect(project!.image).toBeTruthy();
    expect(project!.createdAt).toBeTruthy();
  });

  it('createProject calls addProject callback', () => {
    const addProject = vi.fn();
    const updateProjectStatus = vi.fn();
    const { result } = renderHook(() =>
      useMockAdmin(addProject, updateProjectStatus)
    );

    act(() => {
      result.current.createProject(mockForm);
    });

    expect(addProject).toHaveBeenCalledTimes(1);
    expect(addProject).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'New Solar Project' })
    );
  });

  it('createProject generates sequential IDs', () => {
    const addProject = vi.fn();
    const updateProjectStatus = vi.fn();
    const { result } = renderHook(() =>
      useMockAdmin(addProject, updateProjectStatus)
    );

    let p1: Project, p2: Project;
    act(() => {
      p1 = result.current.createProject(mockForm);
    });
    act(() => {
      p2 = result.current.createProject({
        ...mockForm,
        name: 'Second Project',
      });
    });

    expect(p1!.id).not.toBe(p2!.id);
  });

  it('updateStatus calls updateProjectStatus callback', () => {
    const addProject = vi.fn();
    const updateProjectStatus = vi.fn();
    const { result } = renderHook(() =>
      useMockAdmin(addProject, updateProjectStatus)
    );

    act(() => {
      result.current.updateStatus('SOL-001', 'Active');
    });

    expect(updateProjectStatus).toHaveBeenCalledWith('SOL-001', 'Active');
  });

  it('updateStatus sets isLoading then clears it after delay', () => {
    const addProject = vi.fn();
    const updateProjectStatus = vi.fn();
    const { result } = renderHook(() =>
      useMockAdmin(addProject, updateProjectStatus)
    );

    act(() => {
      result.current.updateStatus('SOL-001', 'Active');
    });
    expect(result.current.isLoading).toBe(true);

    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current.isLoading).toBe(false);
  });

  it('handles Repaid status', () => {
    const addProject = vi.fn();
    const updateProjectStatus = vi.fn();
    const { result } = renderHook(() =>
      useMockAdmin(addProject, updateProjectStatus)
    );

    act(() => {
      result.current.updateStatus('SOL-001', 'Repaid');
    });

    expect(updateProjectStatus).toHaveBeenCalledWith('SOL-001', 'Repaid');
  });

  it('handles Defaulted status', () => {
    const addProject = vi.fn();
    const updateProjectStatus = vi.fn();
    const { result } = renderHook(() =>
      useMockAdmin(addProject, updateProjectStatus)
    );

    act(() => {
      result.current.updateStatus('SOL-003', 'Defaulted');
    });

    expect(updateProjectStatus).toHaveBeenCalledWith('SOL-003', 'Defaulted');
  });
});
