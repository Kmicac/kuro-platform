'use client'

import { useQuery } from '@tanstack/react-query'
import { trainingCalendarApi } from '@/lib/api/endpoints'
import type { CalendarItemType, SessionStatus } from '@/lib/api/types'
import { STALE, kuroRetry } from './_shared'

export interface UseTrainingCalendarParams {
  from: string // YYYY-MM-DD
  to: string   // YYYY-MM-DD
  branchId?: string
  view?: 'MONTH' | 'WEEK' | 'DAY' | 'LIST'
  itemType?: CalendarItemType | 'ALL'
  status?: SessionStatus | string
}

export function useTrainingCalendar(
  orgId: string,
  params: UseTrainingCalendarParams
) {
  return useQuery({
    queryKey: [
      'training-calendar',
      orgId,
      {
        from: params.from,
        to: params.to,
        branchId: params.branchId ?? null,
        view: params.view ?? null,
        itemType: params.itemType ?? null,
        status: params.status ?? null,
      },
    ],
    queryFn: () => trainingCalendarApi.get(orgId, params),
    staleTime: STALE.analytics,
    retry: kuroRetry,
    enabled: Boolean(orgId && params.from && params.to),
  })
}
