'use client'

import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'

export type PersonAvatarProps = {
  avatarUrl?: string | null
  displayName?: string | null
  firstName?: string | null
  lastName?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  imageClassName?: string
  fallbackClassName?: string
  title?: string
}

const SIZE_CLASS: Record<NonNullable<PersonAvatarProps['size']>, string> = {
  xs: 'h-6 w-6 text-[9px]',
  sm: 'h-8 w-8 text-[10px]',
  md: 'h-10 w-10 text-xs',
  lg: 'h-14 w-14 text-base',
  xl: 'h-16 w-16 text-lg',
}

export function PersonAvatar({
  avatarUrl,
  displayName,
  firstName,
  lastName,
  size = 'md',
  className,
  imageClassName,
  fallbackClassName,
  title,
}: PersonAvatarProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null)

  const resolvedName = useMemo(
    () => resolveName(displayName, firstName, lastName),
    [displayName, firstName, lastName],
  )
  const initials = useMemo(
    () => resolveInitials(displayName, firstName, lastName),
    [displayName, firstName, lastName],
  )
  const showImage = Boolean(avatarUrl) && failedUrl !== avatarUrl
  const alt = resolvedName || 'Avatar'

  return (
    <span
      title={title ?? resolvedName ?? undefined}
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full',
        SIZE_CLASS[size],
        className,
      )}
    >
      {showImage ? (
        // `next/image` queda fuera de esta subfase; usamos `img` nativo
        // para aceptar cualquier `avatarUrl` sin tocar remote patterns.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl ?? undefined}
          alt={alt}
          className={cn('h-full w-full object-cover', imageClassName)}
          onError={() => setFailedUrl(avatarUrl ?? null)}
        />
      ) : (
        <span
          aria-hidden
          className={cn(
            'flex h-full w-full items-center justify-center border font-bold uppercase',
            'bg-[color-mix(in_srgb,var(--primary)_14%,transparent)] text-primary',
            'border-[color-mix(in_srgb,var(--primary)_30%,transparent)]',
            fallbackClassName,
          )}
        >
          {initials}
        </span>
      )}
    </span>
  )
}

function resolveName(
  displayName?: string | null,
  firstName?: string | null,
  lastName?: string | null,
): string | null {
  const visibleDisplayName = displayName?.trim()
  if (visibleDisplayName) return visibleDisplayName

  const joined = [firstName, lastName]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(' ')
    .trim()

  return joined || null
}

function resolveInitials(
  displayName?: string | null,
  firstName?: string | null,
  lastName?: string | null,
): string {
  const name = resolveName(displayName, firstName, lastName)
  if (!name) return '?'

  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'

  if (parts.length === 1) {
    const chars = pickChars(parts[0], 2)
    return chars || '?'
  }

  const first = pickChars(parts[0], 1)
  const last = pickChars(parts[parts.length - 1], 1)
  return `${first}${last}`.trim().toUpperCase() || '?'
}

function pickChars(value: string, max: number): string {
  const chars = Array.from(value).filter((char) => /[\p{L}\p{N}]/u.test(char))
  return chars.slice(0, max).join('').toUpperCase()
}
