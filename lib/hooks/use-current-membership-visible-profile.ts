'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  currentMembershipVisibleProfileApi,
  deleteMyAvatar,
  uploadMyAvatar,
} from '@/lib/api/endpoints'
import type { CurrentMembershipVisibleProfile } from '@/lib/api/types'
import { STALE, kuroRetry } from './_shared'

export function currentMembershipVisibleProfileKey(orgId: string) {
  return ['current-membership-visible-profile', orgId] as const
}

export function useCurrentMembershipVisibleProfile(orgId?: string | null) {
  return useQuery({
    queryKey: currentMembershipVisibleProfileKey(orgId ?? ''),
    queryFn: () => currentMembershipVisibleProfileApi.get(orgId ?? ''),
    staleTime: STALE.reference,
    retry: kuroRetry,
    enabled: Boolean(orgId),
  })
}

export function useUploadMyAvatar() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      organizationId,
      file,
    }: {
      organizationId: string
      file: File
    }) => uploadMyAvatar(organizationId, file),
    onSuccess: async (data, variables) => {
      const uploadedAvatarUrl = normalizeAvatarUrl(data.avatarUrl)
      if (!uploadedAvatarUrl) return

      const queryKey = currentMembershipVisibleProfileKey(
        variables.organizationId,
      )
      const previous =
        queryClient.getQueryData<CurrentMembershipVisibleProfile | null>(
          queryKey,
        )

      queryClient.setQueryData<CurrentMembershipVisibleProfile | null>(
        queryKey,
        (old) => (old ? { ...old, avatarUrl: uploadedAvatarUrl } : old),
      )
      await queryClient.refetchQueries({ queryKey, type: 'active' })

      const latest =
        queryClient.getQueryData<CurrentMembershipVisibleProfile | null>(
          queryKey,
        )
      if (latest && !normalizeAvatarUrl(latest.avatarUrl)) {
        queryClient.setQueryData<CurrentMembershipVisibleProfile | null>(
          queryKey,
          (old) => (old ? { ...old, avatarUrl: uploadedAvatarUrl } : old),
        )
        if (process.env.NODE_ENV !== 'production') {
          console.warn('KURO avatar profile mismatch after upload', {
            organizationId: variables.organizationId,
            membershipId: latest.membershipId ?? previous?.membershipId,
            uploadAvatarUrl: uploadedAvatarUrl,
            profileAvatarUrl: latest.avatarUrl,
          })
        }
      }
    },
  })
}

export function useDeleteMyAvatar() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ organizationId }: { organizationId: string }) =>
      deleteMyAvatar(organizationId),
    onSuccess: async (data, variables) => {
      const queryKey = currentMembershipVisibleProfileKey(
        variables.organizationId,
      )
      queryClient.setQueryData<CurrentMembershipVisibleProfile | null>(
        queryKey,
        (old) => (old ? { ...old, avatarUrl: data.avatarUrl } : old),
      )
      await queryClient.invalidateQueries({ queryKey })
    },
  })
}

function normalizeAvatarUrl(value: string | null): string | null {
  const normalized = value?.trim()
  return normalized ? normalized : null
}
