import { useState, useMemo } from 'react';
import type { Project, ProjectStatus } from '../types';

type FilterStatus = 'All' | ProjectStatus;
type SortKey = 'apy' | 'progress' | 'newest';

export function useProjectFilters(projects: Project[]) {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('All');
  const [sortKey, setSortKey] = useState<SortKey>('newest');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let result = [...projects];
    if (filterStatus !== 'All') {
      result = result.filter(p => p.status === filterStatus);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        p =>
          p.name.toLowerCase().includes(q) ||
          p.location.toLowerCase().includes(q) ||
          p.installerName.toLowerCase().includes(q)
      );
    }
    result.sort((a, b) => {
      if (sortKey === 'apy') return b.apy - a.apy;
      if (sortKey === 'progress') return b.fundingProgress - a.fundingProgress;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return result;
  }, [projects, filterStatus, search, sortKey]);

  return {
    filterStatus,
    setFilterStatus,
    sortKey,
    setSortKey,
    search,
    setSearch,
    filtered,
  };
}
