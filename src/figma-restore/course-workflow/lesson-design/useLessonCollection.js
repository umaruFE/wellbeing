import { useEffect, useState } from 'react';
import apiService from '../../../services/api';

export function useLessonCollection(path, accountId) {
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState(null);
  useEffect(() => {
    if (!accountId) return;
    const controller = new AbortController();
    apiService.request(path, { signal: controller.signal })
      .then(({ data }) => {
        if (!Array.isArray(data)) throw new Error('Invalid collection response');
        if (!controller.signal.aborted) setResult({ accountId, revision, data });
      })
      .catch(() => {
        if (!controller.signal.aborted) setResult({ accountId, revision, error: true });
      });
    return () => controller.abort();
  }, [path, accountId, revision]);

  const current = accountId && result?.accountId === accountId && result.revision === revision ? result : null;
  return {
    items: current?.data || [], loading: Boolean(accountId && !current), error: Boolean(current?.error),
    reload: () => setRevision(value => value + 1),
  };
}

export function matchesFavorite(record, courseRef, phaseKey, step) {
  if (!step || record.courseRef !== courseRef || record.phaseKey !== phaseKey) return false;
  if (record.step.id != null || step.id != null) return String(record.step.id ?? '') === String(step.id ?? '');
  return Object.entries(record.step).every(([key, value]) => value === (step[key] ?? ''));
}
