'use client'

/**
 * Calendar — date picker sobre react-day-picker v10, estilado con tokens KURO.
 * API v10: classNames via getDefaultClassNames() + override del icono con el
 * slot `components.Chevron`. Usar dentro de un <Popover> para campos de fecha.
 */
import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  DayPicker,
  getDefaultClassNames,
  type ChevronProps,
} from 'react-day-picker'

import { cn } from '@/lib/utils'

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  const defaults = getDefaultClassNames()

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      classNames={{
        months: cn('relative flex flex-col gap-4 sm:flex-row', defaults.months),
        month: cn('flex flex-col gap-4', defaults.month),
        month_caption: cn(
          'flex h-8 items-center justify-center',
          defaults.month_caption,
        ),
        caption_label: cn('text-sm font-medium', defaults.caption_label),
        nav: cn('absolute inset-x-0 top-0 flex items-center justify-between', defaults.nav),
        button_previous: cn(
          'inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-transparent opacity-70 hover:opacity-100 disabled:opacity-30',
          defaults.button_previous,
        ),
        button_next: cn(
          'inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-transparent opacity-70 hover:opacity-100 disabled:opacity-30',
          defaults.button_next,
        ),
        month_grid: cn('w-full border-collapse', defaults.month_grid),
        weekdays: cn('flex', defaults.weekdays),
        weekday: cn(
          'w-9 text-[0.8rem] font-normal text-muted-foreground',
          defaults.weekday,
        ),
        week: cn('mt-2 flex w-full', defaults.week),
        day: cn('h-9 w-9 p-0 text-center text-sm', defaults.day),
        day_button: cn(
          'inline-flex h-9 w-9 items-center justify-center rounded-md font-normal hover:bg-accent hover:text-accent-foreground aria-selected:opacity-100',
          defaults.day_button,
        ),
        today: cn(
          'rounded-md bg-accent text-accent-foreground',
          defaults.today,
        ),
        selected: cn(
          '[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary',
          defaults.selected,
        ),
        outside: cn('text-muted-foreground opacity-50', defaults.outside),
        disabled: cn('text-muted-foreground opacity-50', defaults.disabled),
        hidden: cn('invisible', defaults.hidden),
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: chevronClass }: ChevronProps) => {
          const Icon = orientation === 'left' ? ChevronLeft : ChevronRight
          return <Icon className={cn('h-4 w-4', chevronClass)} />
        },
      }}
      {...props}
    />
  )
}

export { Calendar }
