'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { useTranslations } from 'next-intl'
import { Camera, Loader2, Trash2, Upload } from 'lucide-react'

import { PersonAvatar } from '@/components/common/person-avatar'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ApiError } from '@/lib/api/client'
import {
  useCurrentMembershipVisibleProfile,
  useDeleteMyAvatar,
  useUploadMyAvatar,
} from '@/lib/hooks'
import { useAuthStore } from '@/stores/auth.store'
import { notifyError, notifySuccess } from '@/lib/utils/toast'

interface CurrentUserAvatarDialogProps {
  orgId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

const MAX_AVATAR_BYTES = 2_097_152
const ALLOWED_AVATAR_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
])
type AvatarDialogT = ReturnType<typeof useTranslations>

export function CurrentUserAvatarDialog({
  orgId,
  open,
  onOpenChange,
}: CurrentUserAvatarDialogProps) {
  const t = useTranslations('navigation.topbar.avatarDialog')
  const inputRef = useRef<HTMLInputElement>(null)
  const user = useAuthStore((s) => s.user)
  const profileQuery = useCurrentMembershipVisibleProfile(orgId)
  const upload = useUploadMyAvatar()
  const remove = useDeleteMyAvatar()

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)

  const profile = profileQuery.data
  const authDisplayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() || null
  const displayName = profile?.displayName?.trim() || authDisplayName
  const firstName = profile?.firstName ?? user?.firstName ?? null
  const lastName = profile?.lastName ?? user?.lastName ?? null
  const currentAvatarUrl = profile?.avatarUrl ?? null
  const visibleAvatarUrl = previewUrl ?? currentAvatarUrl
  const isWorking = upload.isPending || remove.isPending

  const clearLocalSelection = useCallback(() => {
    setSelectedFile(null)
    setFileError(null)
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current)
      return null
    })
    if (inputRef.current) inputRef.current.value = ''
  }, [])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) clearLocalSelection()
    onOpenChange(nextOpen)
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    const validationError = validateAvatarFile(file, t)

    if (validationError) {
      clearLocalSelection()
      setFileError(validationError)
      return
    }
    if (!file) return

    setFileError(null)
    setSelectedFile(file)
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current)
      return URL.createObjectURL(file)
    })
  }

  const handleUpload = () => {
    const validationError = validateAvatarFile(selectedFile, t)
    if (validationError) {
      setFileError(validationError)
      return
    }
    if (!selectedFile) return

    upload.mutate(
      { organizationId: orgId, file: selectedFile },
      {
        onSuccess: (data) => {
          if (!normalizeAvatarUrl(data.avatarUrl)) {
            notifyError(t('errors.noPublicUrl'))
            return
          }
          clearLocalSelection()
          notifySuccess(t('success.updated'))
        },
        onError: (error) => {
          notifyError(uploadErrorMessage(error, t), error)
        },
      },
    )
  }

  const handleDelete = () => {
    remove.mutate(
      { organizationId: orgId },
      {
        onSuccess: () => {
          clearLocalSelection()
          notifySuccess(t('success.deleted'))
        },
        onError: (error) => {
          notifyError(deleteErrorMessage(error, t), error)
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-[360px] gap-3 p-5">
        <DialogHeader className="space-y-1 pr-6">
          <DialogTitle className="text-base">{t('title')}</DialogTitle>
          <DialogDescription className="text-xs leading-5">
            {t('description')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-3 rounded-md border border-border bg-muted/30 p-3">
          <PersonAvatar
            avatarUrl={visibleAvatarUrl}
            displayName={displayName}
            firstName={firstName}
            lastName={lastName}
            size="xl"
            className="h-14 w-14"
            fallbackClassName="text-base"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              {displayName ?? t('fallbackName')}
            </p>
            <p className="mt-0.5 truncate text-[11px] leading-4 text-muted-foreground">
              {selectedFile ? selectedFile.name : t('currentHint')}
            </p>
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          aria-label={t('fileInputLabel')}
          onChange={handleFileChange}
        />

        {fileError && (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs leading-5 text-destructive" role="alert">
            {fileError}
          </p>
        )}

        <DialogFooter className="grid gap-2 sm:grid-cols-2 sm:space-x-0">
          <div className="grid gap-2 sm:col-span-2 sm:grid-cols-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={isWorking}
              className="w-full"
            >
              <Camera className="mr-2 h-4 w-4" aria-hidden />
              {t('actions.change')}
            </Button>
            {currentAvatarUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={isWorking}
                className="w-full text-destructive hover:text-destructive"
              >
                {remove.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" aria-hidden />
                )}
                {t('actions.delete')}
              </Button>
            )}
          </div>

          <Button
            type="button"
            size="sm"
            onClick={handleUpload}
            disabled={!selectedFile || isWorking}
            className="sm:col-span-2"
          >
            {upload.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Upload className="mr-2 h-4 w-4" aria-hidden />
            )}
            {t('actions.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function validateAvatarFile(
  file: File | null,
  t: AvatarDialogT,
): string | null {
  if (!file) return t('validation.required')
  if (!ALLOWED_AVATAR_TYPES.has(file.type)) return t('validation.type')
  if (file.size > MAX_AVATAR_BYTES) return t('validation.size')
  return null
}

function normalizeAvatarUrl(value: string | null): string | null {
  const normalized = value?.trim()
  return normalized ? normalized : null
}

function uploadErrorMessage(
  error: unknown,
  t: AvatarDialogT,
): string {
  if (error instanceof ApiError) {
    if (error.status === 403) return t('errors.forbidden')
    if (error.status === 413) return t('errors.tooLarge')
  }
  return t('errors.update')
}

function deleteErrorMessage(
  error: unknown,
  t: AvatarDialogT,
): string {
  if (error instanceof ApiError && error.status === 403) {
    return t('errors.forbidden')
  }
  return t('errors.delete')
}
