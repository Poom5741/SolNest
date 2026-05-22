import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMockProjects } from './useMockProjects';

describe('useMockProjects', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns initial project list with 8 projects', () => {
    const { result } = renderHook(() => useMockProjects());
    expect(result.current.data).toHaveLength(8);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('returns projects with expected shape', () => {
    const { result } = renderHook(() => useMockProjects());
    const project = result.current.data[0];
    expect(project).toHaveProperty('id');
    expect(project).toHaveProperty('name');
    expect(project).toHaveProperty('location');
    expect(project).toHaveProperty('systemSize');
    expect(project).toHaveProperty('targetAmount');
    expect(project).toHaveProperty('fundingProgress');
    expect(project).toHaveProperty('apy');
    expect(project).toHaveProperty('duration');
    expect(project).toHaveProperty('risk');
    expect(project).toHaveProperty('status');
    expect(project).toHaveProperty('description');
    expect(project).toHaveProperty('image');
    expect(project).toHaveProperty('installerName');
    expect(project).toHaveProperty('investorCount');
    expect(project).toHaveProperty('createdAt');
  });

  it('adds a project via addProject', () => {
    const { result } = renderHook(() => useMockProjects());
    const initialLength = result.current.data.length;
    act(() => {
      result.current.addProject({
        id: 'SOL-009',
        name: 'Test Farm',
        location: 'Chiang Mai',
        systemSize: 10,
        targetAmount: 10000,
        fundingProgress: 0,
        apy: 12,
        duration: 24,
        risk: 'Low',
        status: 'Created',
        description: 'test',
        image: 'test.jpg',
        installerName: 'Test Installer',
        investorCount: 0,
        createdAt: '2025-01-01',
      });
    });
    expect(result.current.data).toHaveLength(initialLength + 1);
    expect(result.current.data[0].id).toBe('SOL-009');
  });

  it('updates project status', () => {
    const { result } = renderHook(() => useMockProjects());
    const targetId = result.current.data[0].id;
    act(() => {
      result.current.updateProjectStatus(targetId, 'Active');
    });
    const updated = result.current.data.find((p) => p.id === targetId);
    expect(updated?.status).toBe('Active');
  });

  it('returns project by id', () => {
    const { result } = renderHook(() => useMockProjects());
    const target = result.current.data[0];
    const found = result.current.getProjectById(target.id);
    expect(found).toEqual(target);
  });

  it('getProjectById returns undefined for nonexistent id', () => {
    const { result } = renderHook(() => useMockProjects());
    expect(result.current.getProjectById('NONEXISTENT')).toBeUndefined();
  });

  it('updating nonexistent id does not change array', () => {
    const { result } = renderHook(() => useMockProjects());
    const initialLength = result.current.data.length;
    act(() => {
      result.current.updateProjectStatus('NONEXISTENT', 'Active');
    });
    expect(result.current.data).toHaveLength(initialLength);
  });

  it('mutate sets isLoading then clears after delay', () => {
    const { result } = renderHook(() => useMockProjects());
    act(() => {
      result.current.mutate();
    });
    expect(result.current.isLoading).toBe(true);
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current.isLoading).toBe(false);
  });
});
