'use client'

// ⚠️ i18n (Fase 2.1) — alcance parcial por decisión de producto.
// Este es un componente genérico vendored. La página de calendario de KURO
// lo usa con `hideHeader` + `hideFilters` + `onEventClick` propio, así que su
// toolbar, sus filtros y el diálogo de crear/editar clase NO se renderizan en
// la app. Por eso SOLO se migraron a next-intl los strings ALCANZABLES desde
// la grilla (vistas month/week/day/list): "Hora", "+N más" y el empty de la
// lista. El resto de los textos en español de este archivo (toolbar, selects,
// diálogo, labels de filtro, nombres de KURO_CLASS_TYPE_COLORS) queda
// HARDCODEADO a propósito.
// TODO(i18n): si en el futuro se habilita el header/filtros/diálogo nativos,
// migrar esos strings y mover el formateo de fechas/horas (DOW_*_ES,
// formatShortDate, formatGroupedDate, formatTime, "HH:00") a useFormatter.
//
// KURO custom: en la vista MONTH (componente MonthView) las celdas de meses
// adyacentes se atenúan (número en text-muted-foreground/60 y eventos en
// opacity-60), tipo Google Calendar. En WEEK se usa semana lunes-domingo para
// coincidir con TrainingCalendar y el backend class-calendar.
import { useCallback, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  Filter,
  Grid3x3,
  List,
  Plus,
  Search,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

// ──────────────────────────────────────────────────────────────
// Tipos públicos
// ──────────────────────────────────────────────────────────────

export interface Event {
  id: string
  title: string
  description?: string
  startTime: Date
  endTime: Date
  color: string
  category?: string
  attendees?: string[]
  tags?: string[]
  /** KURO: evento atenuado + tachado (ej. clase cancelada). */
  dimmed?: boolean
}

export interface EventColor {
  name: string
  value: string
  bg: string
  text: string
}

export type EventManagerView = 'month' | 'week' | 'day' | 'list'

export interface EventManagerProps {
  /** Lista de eventos a mostrar. El componente es CONTROLLED: el padre
   *  es responsable de actualizar este array (vía TanStack Query). */
  events: Event[]

  /** Callback de creación. El padre persiste y refresca el cache. */
  onEventCreate?: (event: Omit<Event, 'id'>) => void

  /** Callback de edición. El padre persiste el patch. */
  onEventUpdate?: (id: string, event: Partial<Event>) => void

  /** Callback de borrado. El padre persiste la eliminación. */
  onEventDelete?: (id: string) => void

  /** Tipos seleccionables en el formulario (Tipo de clase). */
  categories?: string[]

  /** Paleta de colores. Por defecto usa KURO_CLASS_TYPE_COLORS. */
  colors?: EventColor[]

  /** Etiquetas seleccionables en el formulario. */
  availableTags?: string[]

  /** Vista inicial (si no se controla externamente). */
  defaultView?: EventManagerView

  /** Si se provee, la vista pasa a estar CONTROLADA por el padre. */
  view?: EventManagerView
  onViewChange?: (view: EventManagerView) => void

  /** Si se provee, la fecha de referencia pasa a estar CONTROLADA. */
  currentDate?: Date
  onDateChange?: (date: Date) => void

  /** Si se provee, intercepta el click en evento (en vez de abrir
   *  el diálogo interno de edición). Útil cuando el padre maneja
   *  el detalle por su cuenta (ej. side-panel o navegación). */
  onEventClick?: (event: Event) => void

  /** Ocultar el header interno (título + nav + view switcher + CTA). */
  hideHeader?: boolean

  /** Ocultar la barra de búsqueda + filter dropdowns + chips activos. */
  hideFilters?: boolean

  /**
   * KURO custom: rango horario visible en las vistas week/day (hora local).
   * Default 0..24 = día completo (comportamiento original). Las vistas month y
   * list los ignoran. Los eventos fuera del rango no desaparecen: se reportan
   * con un banner que enlaza a la vista list (ver OutOfRangeBanner).
   */
  startHour?: number
  endHour?: number

  className?: string
}

// ──────────────────────────────────────────────────────────────
// Mapeo de tipos de clase del backend (CalendarItem.classSession.classType)
// a colores KURO.
//
// Uso desde el padre:
//
//   const colorValue = KURO_CLASS_TYPE_COLORS.find(
//     c => c.value === (calendarItem.classSession?.classType ?? 'PRIVATE')
//   )?.value ?? 'gray'
//
// El `value` del color es el classType del enum del backend (en mayúsculas),
// lo que permite ir y volver entre dato y presentación sin tablas intermedias.
// ──────────────────────────────────────────────────────────────

// Paleta SOBRIA KURO (Design System 2.5.3). Espeja los hex de
// `lib/constants/class-types.ts` (CLASS_TYPE_HEX). Acá se usan como clases
// arbitrarias LITERALES porque el JIT de Tailwind solo detecta strings
// literales (no se pueden derivar por template). Si cambiás un hex en el
// constant, actualizá el literal correspondiente acá.
export const KURO_CLASS_TYPE_COLORS: EventColor[] = [
  { name: 'Gi',            value: 'GI',            bg: 'bg-[#3F5C45]', text: 'text-[#3F5C45]' },
  { name: 'No-Gi',         value: 'NO_GI',         bg: 'bg-[#5C4A3F]', text: 'text-[#5C4A3F]' },
  { name: 'Fundamentos',   value: 'FUNDAMENTALS',  bg: 'bg-[#4A5760]', text: 'text-[#4A5760]' },
  { name: 'Avanzados',     value: 'ADVANCED',      bg: 'bg-[#6B5840]', text: 'text-[#6B5840]' },
  { name: 'Kids',          value: 'KIDS',          bg: 'bg-[#8A7B5F]', text: 'text-[#8A7B5F]' },
  { name: 'Competición',   value: 'COMPETITION',   bg: 'bg-[#3F4858]', text: 'text-[#3F4858]' },
  { name: 'Open Mat',      value: 'OPEN_MAT',      bg: 'bg-[#5F6B45]', text: 'text-[#5F6B45]' },
  { name: 'Seminario',     value: 'SEMINAR',       bg: 'bg-[#705045]', text: 'text-[#705045]' },
  { name: 'Privada',       value: 'PRIVATE',       bg: 'bg-[#4A4540]', text: 'text-[#4A4540]' },
]

// ──────────────────────────────────────────────────────────────
// Formateadores en español (es-AR)
// ──────────────────────────────────────────────────────────────

const DOW_SHORT_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const DOW_NARROW_ES = ['D', 'L', 'M', 'M', 'J', 'V', 'S']

function formatMonthYear(d: Date) {
  return d.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
}
function formatLongDate(d: Date) {
  return d.toLocaleDateString('es-AR', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}
function formatShortDate(d: Date) {
  return d.toLocaleDateString('es-AR', { month: 'short', day: 'numeric' })
}
function formatGroupedDate(d: Date) {
  return d.toLocaleDateString('es-AR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
function formatTime(d: Date) {
  return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

function startOfISOWeek(d: Date) {
  const start = new Date(d)
  start.setHours(0, 0, 0, 0)
  const day = start.getDay()
  const diff = (day + 6) % 7
  start.setDate(start.getDate() - diff)
  return start
}

// ──────────────────────────────────────────────────────────────
// EventManager — controlled
// ──────────────────────────────────────────────────────────────

export function EventManager({
  events,
  onEventCreate,
  onEventUpdate,
  onEventDelete,
  categories = ['Clase', 'Seminario', 'Evento', 'Privada'],
  colors = KURO_CLASS_TYPE_COLORS,
  defaultView = 'month',
  view: controlledView,
  onViewChange,
  currentDate: controlledDate,
  onDateChange,
  onEventClick: externalEventClick,
  hideHeader = false,
  hideFilters = false,
  // KURO custom: rango horario visible en week/day (default día completo).
  startHour = 0,
  endHour = 24,
  className,
  availableTags = ['Adultos', 'Kids', 'Femenino', 'Competición', 'Open Mat'],
}: EventManagerProps) {
  // ── Estado de UI (NO datos) ─────────────────────────────────
  const [internalDate, setInternalDate] = useState(new Date())
  const [internalView, setInternalView] = useState<EventManagerView>(defaultView)

  const currentDate = controlledDate ?? internalDate
  const view = controlledView ?? internalView

  const setCurrentDate = useCallback(
    (next: Date | ((prev: Date) => Date)) => {
      const resolved = typeof next === 'function' ? next(currentDate) : next
      if (controlledDate === undefined) setInternalDate(resolved)
      onDateChange?.(resolved)
    },
    [currentDate, controlledDate, onDateChange],
  )

  const setView = useCallback(
    (next: EventManagerView) => {
      if (controlledView === undefined) setInternalView(next)
      onViewChange?.(next)
    },
    [controlledView, onViewChange],
  )

  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [draggedEvent, setDraggedEvent] = useState<Event | null>(null)

  const handleEventClick = useCallback(
    (event: Event) => {
      if (externalEventClick) {
        externalEventClick(event)
        return
      }
      setSelectedEvent(event)
      setIsDialogOpen(true)
    },
    [externalEventClick],
  )

  const [newEvent, setNewEvent] = useState<Partial<Event>>({
    title: '',
    description: '',
    color: colors[0]?.value ?? 'GI',
    category: categories[0],
    tags: [],
  })

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  // ── Filtrado ────────────────────────────────────────────────
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const match =
          event.title.toLowerCase().includes(q) ||
          event.description?.toLowerCase().includes(q) ||
          event.category?.toLowerCase().includes(q) ||
          event.tags?.some((t) => t.toLowerCase().includes(q))
        if (!match) return false
      }
      if (selectedColors.length > 0 && !selectedColors.includes(event.color)) {
        return false
      }
      if (selectedTags.length > 0) {
        const hasTag = event.tags?.some((t) => selectedTags.includes(t))
        if (!hasTag) return false
      }
      if (
        selectedCategories.length > 0 &&
        event.category &&
        !selectedCategories.includes(event.category)
      ) {
        return false
      }
      return true
    })
  }, [events, searchQuery, selectedColors, selectedTags, selectedCategories])

  const hasActiveFilters =
    selectedColors.length > 0 ||
    selectedTags.length > 0 ||
    selectedCategories.length > 0

  const clearFilters = () => {
    setSelectedColors([])
    setSelectedTags([])
    setSelectedCategories([])
    setSearchQuery('')
  }

  // ── Callbacks: solo invocan al padre, no mutan estado local ─

  const handleCreateEvent = useCallback(() => {
    if (!newEvent.title || !newEvent.startTime || !newEvent.endTime) return

    onEventCreate?.({
      title: newEvent.title,
      description: newEvent.description,
      startTime: newEvent.startTime,
      endTime: newEvent.endTime,
      color: newEvent.color || colors[0]?.value || 'GI',
      category: newEvent.category,
      attendees: newEvent.attendees,
      tags: newEvent.tags ?? [],
    })

    setIsDialogOpen(false)
    setIsCreating(false)
    setNewEvent({
      title: '',
      description: '',
      color: colors[0]?.value ?? 'GI',
      category: categories[0],
      tags: [],
    })
  }, [newEvent, colors, categories, onEventCreate])

  const handleUpdateEvent = useCallback(() => {
    if (!selectedEvent) return
    onEventUpdate?.(selectedEvent.id, selectedEvent)
    setIsDialogOpen(false)
    setSelectedEvent(null)
  }, [selectedEvent, onEventUpdate])

  const handleDeleteEvent = useCallback(
    (id: string) => {
      onEventDelete?.(id)
      setIsDialogOpen(false)
      setSelectedEvent(null)
    },
    [onEventDelete],
  )

  // ── Drag & drop: no muta local, solo notifica al padre ──────

  const handleDragStart = useCallback((event: Event) => {
    setDraggedEvent(event)
  }, [])

  const handleDragEnd = useCallback(() => {
    setDraggedEvent(null)
  }, [])

  const handleDrop = useCallback(
    (date: Date, hour?: number) => {
      if (!draggedEvent) return
      const duration =
        draggedEvent.endTime.getTime() - draggedEvent.startTime.getTime()
      const newStartTime = new Date(date)
      if (hour !== undefined) newStartTime.setHours(hour, 0, 0, 0)
      const newEndTime = new Date(newStartTime.getTime() + duration)

      onEventUpdate?.(draggedEvent.id, {
        startTime: newStartTime,
        endTime: newEndTime,
      })
      setDraggedEvent(null)
    },
    [draggedEvent, onEventUpdate],
  )

  // ── Navegación de fecha ─────────────────────────────────────

  const navigateDate = useCallback(
    (direction: 'prev' | 'next') => {
      setCurrentDate((prev) => {
        const next = new Date(prev)
        if (view === 'month') {
          next.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1))
        } else if (view === 'week') {
          next.setDate(prev.getDate() + (direction === 'next' ? 7 : -7))
        } else if (view === 'day') {
          next.setDate(prev.getDate() + (direction === 'next' ? 1 : -1))
        }
        return next
      })
    },
    [view, setCurrentDate],
  )

  // ── Helpers ────────────────────────────────────────────────

  const getColorClasses = useCallback(
    (colorValue: string) => {
      const c = colors.find((col) => col.value === colorValue)
      return c || colors[0]
    },
    [colors],
  )

  const toggleTag = (tag: string, creating: boolean) => {
    if (creating) {
      setNewEvent((prev) => ({
        ...prev,
        tags: prev.tags?.includes(tag)
          ? prev.tags.filter((t) => t !== tag)
          : [...(prev.tags ?? []), tag],
      }))
    } else {
      setSelectedEvent((prev) =>
        prev
          ? {
              ...prev,
              tags: prev.tags?.includes(tag)
                ? prev.tags.filter((t) => t !== tag)
                : [...(prev.tags ?? []), tag],
            }
          : null,
      )
    }
  }

  // ── Render ─────────────────────────────────────────────────

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Header */}
      {!hideHeader && (
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <h2 className="text-xl font-semibold sm:text-2xl">
            {view === 'month' && formatMonthYear(currentDate)}
            {view === 'week' && `Semana del ${formatShortDate(currentDate)}`}
            {view === 'day' && formatLongDate(currentDate)}
            {view === 'list' && 'Todas las clases'}
          </h2>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateDate('prev')}
              className="h-8 w-8"
              aria-label="Anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
            >
              Hoy
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateDate('next')}
              className="h-8 w-8"
              aria-label="Siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {/* Mobile: Select */}
          <div className="sm:hidden">
            <Select
              value={view}
              onValueChange={(v) =>
                setView(v as 'month' | 'week' | 'day' | 'list')
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Mes
                  </div>
                </SelectItem>
                <SelectItem value="week">
                  <div className="flex items-center gap-2">
                    <Grid3x3 className="h-4 w-4" />
                    Semana
                  </div>
                </SelectItem>
                <SelectItem value="day">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Día
                  </div>
                </SelectItem>
                <SelectItem value="list">
                  <div className="flex items-center gap-2">
                    <List className="h-4 w-4" />
                    Lista
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Desktop: Button group */}
          <div className="hidden sm:flex items-center gap-1 rounded-lg border bg-background p-1">
            <Button
              variant={view === 'month' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setView('month')}
              className="h-8"
            >
              <Calendar className="h-4 w-4" />
              <span className="ml-1">Mes</span>
            </Button>
            <Button
              variant={view === 'week' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setView('week')}
              className="h-8"
            >
              <Grid3x3 className="h-4 w-4" />
              <span className="ml-1">Semana</span>
            </Button>
            <Button
              variant={view === 'day' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setView('day')}
              className="h-8"
            >
              <Clock className="h-4 w-4" />
              <span className="ml-1">Día</span>
            </Button>
            <Button
              variant={view === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setView('list')}
              className="h-8"
            >
              <List className="h-4 w-4" />
              <span className="ml-1">Lista</span>
            </Button>
          </div>

          <Button
            onClick={() => {
              setIsCreating(true)
              setIsDialogOpen(true)
            }}
            className="w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nueva clase
          </Button>
        </div>
      </div>
      )}

      {!hideFilters && (
      <>
      <div className="flex flex-col gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar clases..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
              onClick={() => setSearchQuery('')}
              aria-label="Limpiar búsqueda"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Mobile: horizontal scroll */}
        <div className="sm:hidden -mx-4 px-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <FilterDropdown
              label="Color"
              filterLabel="Filtrar por color"
              count={selectedColors.length}
              align="start"
              items={colors.map((c) => ({
                key: c.value,
                checked: selectedColors.includes(c.value),
                onChange: (checked) =>
                  setSelectedColors((prev) =>
                    checked ? [...prev, c.value] : prev.filter((x) => x !== c.value),
                  ),
                render: (
                  <div className="flex items-center gap-2">
                    <div className={cn('h-3 w-3 rounded', c.bg)} />
                    {c.name}
                  </div>
                ),
              }))}
            />
            <FilterDropdown
              label="Etiquetas"
              filterLabel="Filtrar por etiqueta"
              count={selectedTags.length}
              align="start"
              items={availableTags.map((t) => ({
                key: t,
                checked: selectedTags.includes(t),
                onChange: (checked) =>
                  setSelectedTags((prev) =>
                    checked ? [...prev, t] : prev.filter((x) => x !== t),
                  ),
                render: t,
              }))}
            />
            <FilterDropdown
              label="Tipo"
              filterLabel="Filtrar por tipo"
              count={selectedCategories.length}
              align="start"
              items={categories.map((c) => ({
                key: c,
                checked: selectedCategories.includes(c),
                onChange: (checked) =>
                  setSelectedCategories((prev) =>
                    checked ? [...prev, c] : prev.filter((x) => x !== c),
                  ),
                render: c,
              }))}
            />
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="gap-2 whitespace-nowrap flex-shrink-0"
              >
                <X className="h-4 w-4" />
                Limpiar filtros
              </Button>
            )}
          </div>
        </div>

        {/* Desktop */}
        <div className="hidden sm:flex items-center gap-2">
          <FilterDropdown
            label="Color"
            filterLabel="Filtrar por color"
            count={selectedColors.length}
            align="end"
            items={colors.map((c) => ({
              key: c.value,
              checked: selectedColors.includes(c.value),
              onChange: (checked) =>
                setSelectedColors((prev) =>
                  checked ? [...prev, c.value] : prev.filter((x) => x !== c.value),
                ),
              render: (
                <div className="flex items-center gap-2">
                  <div className={cn('h-3 w-3 rounded', c.bg)} />
                  {c.name}
                </div>
              ),
            }))}
          />
          <FilterDropdown
            label="Etiquetas"
            filterLabel="Filtrar por etiqueta"
            count={selectedTags.length}
            align="end"
            items={availableTags.map((t) => ({
              key: t,
              checked: selectedTags.includes(t),
              onChange: (checked) =>
                setSelectedTags((prev) =>
                  checked ? [...prev, t] : prev.filter((x) => x !== t),
                ),
              render: t,
            }))}
          />
          <FilterDropdown
            label="Tipo"
            filterLabel="Filtrar por tipo"
            count={selectedCategories.length}
            align="end"
            items={categories.map((c) => ({
              key: c,
              checked: selectedCategories.includes(c),
              onChange: (checked) =>
                setSelectedCategories((prev) =>
                  checked ? [...prev, c] : prev.filter((x) => x !== c),
                ),
              render: c,
            }))}
          />
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Limpiar filtros
            </Button>
          )}
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Filtros activos:
          </span>
          {selectedColors.map((colorValue) => {
            const color = getColorClasses(colorValue)
            return (
              <Badge key={colorValue} variant="secondary" className="gap-1">
                <div className={cn('h-2 w-2 rounded-full', color.bg)} />
                {color.name}
                <button
                  onClick={() =>
                    setSelectedColors((prev) =>
                      prev.filter((c) => c !== colorValue),
                    )
                  }
                  className="ml-1 hover:text-foreground"
                  aria-label={`Quitar filtro ${color.name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )
          })}
          {selectedTags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              {tag}
              <button
                onClick={() =>
                  setSelectedTags((prev) => prev.filter((t) => t !== tag))
                }
                className="ml-1 hover:text-foreground"
                aria-label={`Quitar etiqueta ${tag}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {selectedCategories.map((category) => (
            <Badge key={category} variant="secondary" className="gap-1">
              {category}
              <button
                onClick={() =>
                  setSelectedCategories((prev) =>
                    prev.filter((c) => c !== category),
                  )
                }
                className="ml-1 hover:text-foreground"
                aria-label={`Quitar tipo ${category}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      </>
      )}

      {/* Vistas — usan filteredEvents */}
      {view === 'month' && (
        <MonthView
          currentDate={currentDate}
          events={filteredEvents}
          onEventClick={handleEventClick}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDrop={handleDrop}
          getColorClasses={getColorClasses}
        />
      )}
      {view === 'week' && (
        <WeekView
          currentDate={currentDate}
          events={filteredEvents}
          onEventClick={handleEventClick}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDrop={handleDrop}
          getColorClasses={getColorClasses}
          startHour={startHour}
          endHour={endHour}
          onShowList={() => setView('list')}
        />
      )}
      {view === 'day' && (
        <DayView
          currentDate={currentDate}
          events={filteredEvents}
          onEventClick={handleEventClick}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDrop={handleDrop}
          getColorClasses={getColorClasses}
          startHour={startHour}
          endHour={endHour}
          onShowList={() => setView('list')}
        />
      )}
      {view === 'list' && (
        <ListView
          events={filteredEvents}
          onEventClick={handleEventClick}
          getColorClasses={getColorClasses}
        />
      )}

      {/* Dialog interno — solo se monta cuando el padre NO está
          interceptando el click y NO ocultó el header (que es donde
          vive el botón "Nueva clase"). */}
      {(!externalEventClick || !hideHeader) && (
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isCreating ? 'Crear clase' : 'Detalle de la clase'}
            </DialogTitle>
            <DialogDescription>
              {isCreating
                ? 'Agregá una nueva clase al calendario.'
                : 'Visualizá y editá los datos de la clase.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={
                  isCreating ? (newEvent.title ?? '') : (selectedEvent?.title ?? '')
                }
                onChange={(e) =>
                  isCreating
                    ? setNewEvent((prev) => ({ ...prev, title: e.target.value }))
                    : setSelectedEvent((prev) =>
                        prev ? { ...prev, title: e.target.value } : null,
                      )
                }
                placeholder="Título de la clase"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={
                  isCreating
                    ? (newEvent.description ?? '')
                    : (selectedEvent?.description ?? '')
                }
                onChange={(e) =>
                  isCreating
                    ? setNewEvent((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    : setSelectedEvent((prev) =>
                        prev ? { ...prev, description: e.target.value } : null,
                      )
                }
                placeholder="Descripción de la clase"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Inicio</Label>
                <Input
                  id="startTime"
                  type="datetime-local"
                  value={toDatetimeLocal(
                    isCreating ? newEvent.startTime : selectedEvent?.startTime,
                  )}
                  onChange={(e) => {
                    const date = new Date(e.target.value)
                    if (isCreating) {
                      setNewEvent((prev) => ({ ...prev, startTime: date }))
                    } else {
                      setSelectedEvent((prev) =>
                        prev ? { ...prev, startTime: date } : null,
                      )
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">Fin</Label>
                <Input
                  id="endTime"
                  type="datetime-local"
                  value={toDatetimeLocal(
                    isCreating ? newEvent.endTime : selectedEvent?.endTime,
                  )}
                  onChange={(e) => {
                    const date = new Date(e.target.value)
                    if (isCreating) {
                      setNewEvent((prev) => ({ ...prev, endTime: date }))
                    } else {
                      setSelectedEvent((prev) =>
                        prev ? { ...prev, endTime: date } : null,
                      )
                    }
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Tipo</Label>
                <Select
                  value={
                    isCreating ? newEvent.category : selectedEvent?.category
                  }
                  onValueChange={(value) =>
                    isCreating
                      ? setNewEvent((prev) => ({ ...prev, category: value }))
                      : setSelectedEvent((prev) =>
                          prev ? { ...prev, category: value } : null,
                        )
                  }
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Elegí un tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <Select
                  value={isCreating ? newEvent.color : selectedEvent?.color}
                  onValueChange={(value) =>
                    isCreating
                      ? setNewEvent((prev) => ({ ...prev, color: value }))
                      : setSelectedEvent((prev) =>
                          prev ? { ...prev, color: value } : null,
                        )
                  }
                >
                  <SelectTrigger id="color">
                    <SelectValue placeholder="Elegí un color" />
                  </SelectTrigger>
                  <SelectContent>
                    {colors.map((color) => (
                      <SelectItem key={color.value} value={color.value}>
                        <div className="flex items-center gap-2">
                          <div className={cn('h-4 w-4 rounded', color.bg)} />
                          {color.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Etiquetas</Label>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => {
                  const isSelected = isCreating
                    ? newEvent.tags?.includes(tag)
                    : selectedEvent?.tags?.includes(tag)
                  return (
                    <Badge
                      key={tag}
                      variant={isSelected ? 'default' : 'outline'}
                      className="cursor-pointer transition-all hover:scale-105"
                      onClick={() => toggleTag(tag, isCreating)}
                    >
                      {tag}
                    </Badge>
                  )
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            {!isCreating && (
              <Button
                variant="destructive"
                onClick={() =>
                  selectedEvent && handleDeleteEvent(selectedEvent.id)
                }
              >
                Eliminar
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false)
                setIsCreating(false)
                setSelectedEvent(null)
              }}
            >
              Cancelar
            </Button>
            <Button onClick={isCreating ? handleCreateEvent : handleUpdateEvent}>
              {isCreating ? 'Crear clase' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      )}
    </div>
  )
}

// ──────────────────────────────────────────────────────────────
// Subcomponentes
// ──────────────────────────────────────────────────────────────

interface FilterDropdownItem {
  key: string
  checked: boolean
  onChange: (checked: boolean) => void
  render: React.ReactNode
}

function FilterDropdown({
  label,
  filterLabel,
  count,
  align,
  items,
}: {
  label: string
  filterLabel: string
  count: number
  align: 'start' | 'end'
  items: FilterDropdownItem[]
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 whitespace-nowrap flex-shrink-0 bg-transparent"
        >
          <Filter className="h-4 w-4" />
          {label}
          {count > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5">
              {count}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-48">
        <DropdownMenuLabel>{filterLabel}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.map((it) => (
          <DropdownMenuCheckboxItem
            key={it.key}
            checked={it.checked}
            onCheckedChange={(checked) => it.onChange(Boolean(checked))}
          >
            {it.render}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// EventCard con hover
function EventCard({
  event,
  onEventClick,
  onDragStart,
  onDragEnd,
  getColorClasses,
  variant = 'default',
}: {
  event: Event
  onEventClick: (event: Event) => void
  onDragStart: (event: Event) => void
  onDragEnd: () => void
  getColorClasses: (color: string) => EventColor
  variant?: 'default' | 'compact' | 'detailed'
}) {
  const [isHovered, setIsHovered] = useState(false)
  const colorClasses = getColorClasses(event.color)

  const getDuration = () => {
    const diff = event.endTime.getTime() - event.startTime.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  if (variant === 'compact') {
    return (
      <div
        draggable
        onDragStart={() => onDragStart(event)}
        onDragEnd={onDragEnd}
        onClick={() => onEventClick(event)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative cursor-pointer"
      >
        <div
          className={cn(
            'flex items-stretch overflow-hidden rounded-[2px] border border-border/70 bg-muted/50 text-xs transition-colors',
            'animate-in fade-in slide-in-from-top-1',
            isHovered && 'bg-muted',
            event.dimmed && 'opacity-50 line-through',
          )}
        >
          <span className={cn('w-[3px] shrink-0', colorClasses.bg)} aria-hidden />
          <span className="truncate px-1.5 py-0.5 font-medium text-foreground">
            {event.title}
          </span>
        </div>
        {isHovered && (
          <div className="absolute left-0 top-full z-50 mt-1 w-64 animate-in fade-in slide-in-from-top-2 duration-200">
            <Card className="border-2 p-3 shadow-xl">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-semibold text-sm leading-tight">
                    {event.title}
                  </h4>
                  <div
                    className={cn(
                      'h-3 w-3 rounded-full flex-shrink-0',
                      colorClasses.bg,
                    )}
                  />
                </div>
                {event.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {event.description}
                  </p>
                )}
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>
                    {formatTime(event.startTime)} - {formatTime(event.endTime)}
                  </span>
                  <span className="text-[10px]">({getDuration()})</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {event.category && (
                    <Badge variant="secondary" className="text-[10px] h-5">
                      {event.category}
                    </Badge>
                  )}
                  {event.tags?.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="text-[10px] h-5"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    )
  }

  if (variant === 'detailed') {
    return (
      <div
        draggable
        onDragStart={() => onDragStart(event)}
        onDragEnd={onDragEnd}
        onClick={() => onEventClick(event)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          'flex cursor-pointer items-stretch overflow-hidden rounded-[3px] border border-border/70 bg-card transition-colors',
          'animate-in fade-in slide-in-from-left-2',
          isHovered && 'bg-muted',
          event.dimmed && 'opacity-50 line-through',
        )}
      >
        <span className={cn('w-1 shrink-0', colorClasses.bg)} aria-hidden />
        <div className="min-w-0 flex-1 p-3">
          <div className="font-semibold text-foreground">{event.title}</div>
          {event.description && (
            <div className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {event.description}
            </div>
          )}
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {formatTime(event.startTime)} - {formatTime(event.endTime)}
          </div>
          {isHovered && (
            <div className="mt-2 flex flex-wrap gap-1 animate-in fade-in slide-in-from-bottom-1 duration-200">
              {event.category && (
                <Badge variant="secondary" className="text-xs">
                  {event.category}
                </Badge>
              )}
              {event.tags?.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      draggable
      onDragStart={() => onDragStart(event)}
      onDragEnd={onDragEnd}
      onClick={() => onEventClick(event)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative"
    >
      <div
        className={cn(
          'flex cursor-pointer items-stretch overflow-hidden rounded-[2px] border border-border/70 bg-muted/50 text-xs font-medium transition-colors',
          'animate-in fade-in slide-in-from-left-1',
          isHovered && 'bg-muted',
          event.dimmed && 'opacity-50 line-through',
        )}
      >
        <span className={cn('w-[3px] shrink-0', colorClasses.bg)} aria-hidden />
        <div className="truncate px-2 py-1 text-foreground">{event.title}</div>
      </div>
      {isHovered && (
        <div className="absolute left-0 top-full z-50 mt-1 w-72 animate-in fade-in slide-in-from-top-2 duration-200">
          <Card className="border-2 p-4 shadow-xl">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-semibold leading-tight">{event.title}</h4>
                <div
                  className={cn(
                    'h-4 w-4 rounded-full flex-shrink-0',
                    colorClasses.bg,
                  )}
                />
              </div>
              {event.description && (
                <p className="text-sm text-muted-foreground">
                  {event.description}
                </p>
              )}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  <span>
                    {formatTime(event.startTime)} - {formatTime(event.endTime)}
                  </span>
                  <span className="text-[10px]">({getDuration()})</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {event.category && (
                    <Badge variant="secondary" className="text-xs">
                      {event.category}
                    </Badge>
                  )}
                  {event.tags?.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

// Month View
function MonthView({
  currentDate,
  events,
  onEventClick,
  onDragStart,
  onDragEnd,
  onDrop,
  getColorClasses,
}: {
  currentDate: Date
  events: Event[]
  onEventClick: (event: Event) => void
  onDragStart: (event: Event) => void
  onDragEnd: () => void
  onDrop: (date: Date) => void
  getColorClasses: (color: string) => EventColor
}) {
  const t = useTranslations('calendar.grid')
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const startDate = new Date(firstDayOfMonth)
  startDate.setDate(startDate.getDate() - startDate.getDay())

  const days: Date[] = []
  const cursor = new Date(startDate)
  for (let i = 0; i < 42; i++) {
    days.push(new Date(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }

  const getEventsForDay = (date: Date) =>
    events.filter((event) => {
      const d = new Date(event.startTime)
      return (
        d.getDate() === date.getDate() &&
        d.getMonth() === date.getMonth() &&
        d.getFullYear() === date.getFullYear()
      )
    })

  return (
    <Card className="overflow-hidden">
      <div className="grid grid-cols-7 border-b">
        {DOW_SHORT_ES.map((day, idx) => (
          <div
            key={day}
            className="border-r p-2 text-center text-xs font-medium last:border-r-0 sm:text-sm"
          >
            <span className="hidden sm:inline">{day}</span>
            <span className="sm:hidden">{DOW_NARROW_ES[idx]}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day, index) => {
          const dayEvents = getEventsForDay(day)
          const isCurrentMonth = day.getMonth() === currentDate.getMonth()
          const isToday = day.toDateString() === new Date().toDateString()

          return (
            <div
              key={index}
              className={cn(
                'min-h-20 border-b border-r p-1 transition-colors last:border-r-0 sm:min-h-24 sm:p-2',
                !isCurrentMonth && 'bg-muted/30',
                'hover:bg-accent/50',
              )}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(day)}
            >
              <div
                className={cn(
                  'mb-1 flex h-5 w-5 items-center justify-center rounded-full text-xs sm:h-6 sm:w-6 sm:text-sm',
                  isToday && 'bg-primary text-primary-foreground font-semibold',
                  // KURO custom: número de días de meses vecinos atenuado.
                  !isCurrentMonth && !isToday && 'text-muted-foreground/60',
                )}
              >
                {day.getDate()}
              </div>
              {/* KURO custom: eventos de meses vecinos atenuados (opacity-60). */}
              <div className={cn('space-y-1', !isCurrentMonth && 'opacity-60')}>
                {dayEvents.slice(0, 3).map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onEventClick={onEventClick}
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
                    getColorClasses={getColorClasses}
                    variant="compact"
                  />
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-[10px] text-muted-foreground sm:text-xs">
                    {t('moreEvents', { count: dayEvents.length - 3 })}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

// ──────────────────────────────────────────────────────────────
// KURO custom: rango horario visible (week/day) + banner de eventos
// fuera de rango. Las academias BJJ en LATAM operan ~06:00–00:00, así que
// el caller recorta la grilla para no desperdiciar scroll en la madrugada.
// Los eventos fuera del rango NO se ocultan en silencio: se cuentan y se
// ofrece saltar a la vista list (que muestra el día completo).
// ──────────────────────────────────────────────────────────────

/** Etiqueta "HH:00" de una hora (24 → "00:00"). */
function formatHourLabel(hour: number): string {
  return `${String(hour % 24).padStart(2, '0')}:00`
}

/**
 * Cuenta eventos cuyo horario cae fuera de [startHour, endHour), entre los que
 * pasan el predicado de pertenencia (al día o a la semana visible).
 */
function countOutOfRange(
  events: Event[],
  startHour: number,
  endHour: number,
  belongs: (d: Date) => boolean,
): { before: number; after: number } {
  let before = 0
  let after = 0
  for (const event of events) {
    const d = new Date(event.startTime)
    if (!belongs(d)) continue
    const h = d.getHours()
    if (h < startHour) before += 1
    else if (h >= endHour) after += 1
  }
  return { before, after }
}

/**
 * Banner sutil (paleta sobria) que aparece cuando hay clases fuera del rango
 * horario visible. Cada indicador enlaza a la vista list. Si no hay eventos
 * fuera de rango, no renderiza nada.
 */
function OutOfRangeBanner({
  beforeCount,
  afterCount,
  startHour,
  endHour,
  onShowList,
}: {
  beforeCount: number
  afterCount: number
  startHour: number
  endHour: number
  onShowList: () => void
}) {
  const t = useTranslations('calendar.grid')
  if (beforeCount === 0 && afterCount === 0) return null

  return (
    <div className="flex flex-col gap-1 border-b bg-muted/30 px-3 py-2 text-xs sm:flex-row sm:items-center sm:gap-4">
      {beforeCount > 0 && (
        <button
          type="button"
          onClick={onShowList}
          className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronUp className="h-3.5 w-3.5 flex-shrink-0" />
          <span>
            {t('outOfRange.before', {
              count: beforeCount,
              time: formatHourLabel(startHour),
            })}
          </span>
          <span className="underline underline-offset-2">
            {t('outOfRange.viewList')}
          </span>
        </button>
      )}
      {afterCount > 0 && (
        <button
          type="button"
          onClick={onShowList}
          className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronDown className="h-3.5 w-3.5 flex-shrink-0" />
          <span>
            {t('outOfRange.after', {
              count: afterCount,
              time: formatHourLabel(endHour),
            })}
          </span>
          <span className="underline underline-offset-2">
            {t('outOfRange.viewList')}
          </span>
        </button>
      )}
    </div>
  )
}

// Week View
function WeekView({
  currentDate,
  events,
  onEventClick,
  onDragStart,
  onDragEnd,
  onDrop,
  getColorClasses,
  startHour,
  endHour,
  onShowList,
}: {
  currentDate: Date
  events: Event[]
  onEventClick: (event: Event) => void
  onDragStart: (event: Event) => void
  onDragEnd: () => void
  onDrop: (date: Date, hour: number) => void
  getColorClasses: (color: string) => EventColor
  startHour: number
  endHour: number
  onShowList: () => void
}) {
  const t = useTranslations('calendar.grid')
  const startOfWeek = startOfISOWeek(currentDate)

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(startOfWeek)
    day.setDate(startOfWeek.getDate() + i)
    return day
  })

  // KURO custom: rango horario configurable (default 0..24 = día completo).
  const hours = Array.from(
    { length: Math.max(0, endHour - startHour) },
    (_, i) => i + startHour,
  )

  const getEventsForDayAndHour = (date: Date, hour: number) =>
    events.filter((event) => {
      const d = new Date(event.startTime)
      return (
        d.getDate() === date.getDate() &&
        d.getMonth() === date.getMonth() &&
        d.getFullYear() === date.getFullYear() &&
        d.getHours() === hour
      )
    })

  // KURO custom: eventos de la semana fuera del rango horario visible.
  const inWeek = (d: Date) =>
    weekDays.some(
      (wd) =>
        wd.getDate() === d.getDate() &&
        wd.getMonth() === d.getMonth() &&
        wd.getFullYear() === d.getFullYear(),
    )
  const { before: beforeCount, after: afterCount } = countOutOfRange(
    events,
    startHour,
    endHour,
    inWeek,
  )

  return (
    <Card className="overflow-auto">
      <OutOfRangeBanner
        beforeCount={beforeCount}
        afterCount={afterCount}
        startHour={startHour}
        endHour={endHour}
        onShowList={onShowList}
      />
      <div className="grid grid-cols-8 border-b">
        <div className="border-r p-2 text-center text-xs font-medium sm:text-sm">
          {t('hourColumn')}
        </div>
        {weekDays.map((day) => (
          <div
            key={day.toISOString()}
            className="border-r p-2 text-center text-xs font-medium last:border-r-0 sm:text-sm"
          >
            <div className="hidden sm:block">
              {DOW_SHORT_ES[day.getDay()]}
            </div>
            <div className="sm:hidden">{DOW_NARROW_ES[day.getDay()]}</div>
            <div className="text-[10px] text-muted-foreground sm:text-xs">
              {formatShortDate(day)}
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-8">
        {hours.map((hour) => (
          <div key={`row-${hour}`} className="contents">
            <div className="border-b border-r p-1 text-[10px] text-muted-foreground sm:p-2 sm:text-xs">
              {hour.toString().padStart(2, '0')}:00
            </div>
            {weekDays.map((day) => {
              const dayEvents = getEventsForDayAndHour(day, hour)
              return (
                <div
                  key={`${day.toISOString()}-${hour}`}
                  className="min-h-12 border-b border-r p-0.5 transition-colors hover:bg-accent/50 last:border-r-0 sm:min-h-16 sm:p-1"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => onDrop(day, hour)}
                >
                  <div className="space-y-1">
                    {dayEvents.map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        onEventClick={onEventClick}
                        onDragStart={onDragStart}
                        onDragEnd={onDragEnd}
                        getColorClasses={getColorClasses}
                        variant="default"
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </Card>
  )
}

// Day View
function DayView({
  currentDate,
  events,
  onEventClick,
  onDragStart,
  onDragEnd,
  onDrop,
  getColorClasses,
  startHour,
  endHour,
  onShowList,
}: {
  currentDate: Date
  events: Event[]
  onEventClick: (event: Event) => void
  onDragStart: (event: Event) => void
  onDragEnd: () => void
  onDrop: (date: Date, hour: number) => void
  getColorClasses: (color: string) => EventColor
  startHour: number
  endHour: number
  onShowList: () => void
}) {
  // KURO custom: rango horario configurable (default 0..24 = día completo).
  const hours = Array.from(
    { length: Math.max(0, endHour - startHour) },
    (_, i) => i + startHour,
  )

  const sameDay = (d: Date) =>
    d.getDate() === currentDate.getDate() &&
    d.getMonth() === currentDate.getMonth() &&
    d.getFullYear() === currentDate.getFullYear()

  const getEventsForHour = (hour: number) =>
    events.filter((event) => {
      const d = new Date(event.startTime)
      return sameDay(d) && d.getHours() === hour
    })

  // KURO custom: eventos del día fuera del rango horario visible.
  const { before: beforeCount, after: afterCount } = countOutOfRange(
    events,
    startHour,
    endHour,
    sameDay,
  )

  return (
    <Card className="overflow-auto">
      <OutOfRangeBanner
        beforeCount={beforeCount}
        afterCount={afterCount}
        startHour={startHour}
        endHour={endHour}
        onShowList={onShowList}
      />
      <div className="space-y-0">
        {hours.map((hour) => {
          const hourEvents = getEventsForHour(hour)
          return (
            <div
              key={hour}
              className="flex border-b last:border-b-0"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(currentDate, hour)}
            >
              <div className="w-14 flex-shrink-0 border-r p-2 text-xs text-muted-foreground sm:w-20 sm:p-3 sm:text-sm">
                {hour.toString().padStart(2, '0')}:00
              </div>
              <div className="min-h-16 flex-1 p-1 transition-colors hover:bg-accent/50 sm:min-h-20 sm:p-2">
                <div className="space-y-2">
                  {hourEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onEventClick={onEventClick}
                      onDragStart={onDragStart}
                      onDragEnd={onDragEnd}
                      getColorClasses={getColorClasses}
                      variant="detailed"
                    />
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

// List View
function ListView({
  events,
  onEventClick,
  getColorClasses,
}: {
  events: Event[]
  onEventClick: (event: Event) => void
  getColorClasses: (color: string) => EventColor
}) {
  const tEmpty = useTranslations('empty-states.calendar')
  const sortedEvents = [...events].sort(
    (a, b) => a.startTime.getTime() - b.startTime.getTime(),
  )

  const groupedEvents = sortedEvents.reduce(
    (acc, event) => {
      const dateKey = formatGroupedDate(event.startTime)
      if (!acc[dateKey]) acc[dateKey] = []
      acc[dateKey].push(event)
      return acc
    },
    {} as Record<string, Event[]>,
  )

  return (
    <Card className="p-3 sm:p-4">
      <div className="space-y-6">
        {Object.entries(groupedEvents).map(([date, dateEvents]) => (
          <div key={date} className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground sm:text-sm capitalize">
              {date}
            </h3>
            <div className="space-y-2">
              {dateEvents.map((event) => {
                const colorClasses = getColorClasses(event.color)
                return (
                  <div
                    key={event.id}
                    onClick={() => onEventClick(event)}
                    className={cn(
                      'group cursor-pointer rounded-lg border bg-card p-3 transition-all hover:shadow-md hover:scale-[1.01] animate-in fade-in slide-in-from-bottom-2 duration-300 sm:p-4',
                      event.dimmed && 'opacity-50 line-through',
                    )}
                  >
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div
                        className={cn(
                          'mt-1 h-2.5 w-2.5 rounded-full sm:h-3 sm:w-3',
                          colorClasses.bg,
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <h4 className="font-semibold text-sm group-hover:text-primary transition-colors sm:text-base truncate">
                              {event.title}
                            </h4>
                            {event.description && (
                              <p className="mt-1 text-xs text-muted-foreground sm:text-sm line-clamp-2">
                                {event.description}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {event.category && (
                              <Badge variant="secondary" className="text-xs">
                                {event.category}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground sm:gap-4 sm:text-xs">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTime(event.startTime)} -{' '}
                            {formatTime(event.endTime)}
                          </div>
                          {event.tags && event.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {event.tags.map((tag) => (
                                <Badge
                                  key={tag}
                                  variant="outline"
                                  className="text-[10px] h-4 sm:text-xs sm:h-5"
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
        {sortedEvents.length === 0 && (
          <div className="py-12 text-center text-sm text-muted-foreground sm:text-base">
            {tEmpty('noClassesTitle')}
          </div>
        )}
      </div>
    </Card>
  )
}

// ──────────────────────────────────────────────────────────────
// Helpers de fecha
// ──────────────────────────────────────────────────────────────

function toDatetimeLocal(d?: Date) {
  if (!d) return ''
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}
