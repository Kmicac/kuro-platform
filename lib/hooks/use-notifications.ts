'use client'

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query'
import { notificationsApi } from '@/lib/api/endpoints'
import { STALE, kuroRetry } from './_shared'

export const notificationsKeys = {
  list: (orgId: string | null | undefined, page: number, limit: number) =>
    ['notifications', orgId, page, limit] as const,
  unreadCount: (orgId: string | null | undefined) =>
    ['notifications', 'unread-count', orgId] as const,
}

export interface UseNotificationsParams {
  page?: number
  limit?: number
  enabled?: boolean
}

export function useNotifications(
  orgId: string | null | undefined,
  params?: UseNotificationsParams,
) {
  const page = params?.page ?? 1
  const limit = params?.limit ?? 20

  return useQuery({
    queryKey: notificationsKeys.list(orgId, page, limit),
    queryFn: () => notificationsApi.list(orgId as string, { page, limit }),
    staleTime: STALE.resource,
    retry: kuroRetry,
    enabled: Boolean(orgId && (params?.enabled ?? true)),
    placeholderData: keepPreviousData,
  })
}

export function useUnreadNotificationsCount(
  orgId: string | null | undefined,
) {
  return useQuery({
    queryKey: notificationsKeys.unreadCount(orgId),
    queryFn: () => notificationsApi.getUnreadCount(orgId as string),
    staleTime: 30_000,
    retry: kuroRetry,
    enabled: Boolean(orgId),
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  })
}

function invalidateNotificationQueries(
  queryClient: QueryClient,
  orgId: string,
) {
  queryClient.invalidateQueries({
    queryKey: ['notifications', orgId],
  })
  queryClient.invalidateQueries({
    queryKey: notificationsKeys.unreadCount(orgId),
  })
}

export function useMarkNotificationRead(orgId: string | null | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (notificationId: string) =>
      notificationsApi.markRead(orgId as string, notificationId),
    onSuccess: () => {
      if (!orgId) return
      invalidateNotificationQueries(queryClient, orgId)
    },
  })
}

export function useMarkNotificationsRead(orgId: string | null | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (notificationIds: string[]) =>
      notificationsApi.markManyRead(orgId as string, notificationIds),
    onSuccess: () => {
      if (!orgId) return
      invalidateNotificationQueries(queryClient, orgId)
    },
  })
}

export function useMarkAllNotificationsRead(
  orgId: string | null | undefined,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(orgId as string),
    onSuccess: () => {
      if (!orgId) return
      invalidateNotificationQueries(queryClient, orgId)
    },
  })
}
