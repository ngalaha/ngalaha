import { useCallback, useEffect, useState } from 'react';

import { listApartments } from '@/database/apartmentsRepository';
import { Apartment } from '@/types';

/** Loads the apartments configured for a building (empty when none/no building selected). */
export function useApartments(buildingId: string | null) {
  const [apartments, setApartments] = useState<Apartment[]>([]);

  const refresh = useCallback(() => {
    setApartments(buildingId ? listApartments(buildingId) : []);
  }, [buildingId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { apartments, refreshApartments: refresh };
}
