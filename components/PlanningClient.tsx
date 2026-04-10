'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getRooms, getBookings, addBooking, deleteBooking, moveBooking, addRoom, deleteRoom, updateRoom, copyPreviousWeek, getOrganisations, getOrganisationsList, getOrgColors, setOrgColor, deleteOrgColor, updateBookingComment, saveWeekAsTemplate, applyTemplateToWeek, hasTemplate } from '@/server/actions'
import { getWeekKey, shiftWeek } from '@/lib/weekUtils'
import { getOrgColor } from '@/lib/orgColors'
import type { Room, Booking } from '@/server/schema'
import { Header } from './Header'
import { LegendBar } from './LegendBar'
import { PlanningGrid } from './PlanningGrid'
import { BookingModal } from './modals/BookingModal'
import { AddRoomModal } from './modals/AddRoomModal'
import { ColorPickerModal } from './modals/ColorPickerModal'
import { useToast, ToastContainer } from './Toast'
import { exportPlanningToExcel } from '@/lib/exportExcel'

interface Props {
  initialRooms: Room[]
  initialBookings: Booking[]
  initialWeekKey: string
}

export function PlanningClient({ initialRooms, initialBookings, initialWeekKey }: Props) {
  const [currentWeekKey, setCurrentWeekKey] = useState(initialWeekKey)
  const [bookingModal, setBookingModal] = useState<{
    roomId: string; dayIndex: number; slot: number
  } | null>(null)
  const [addRoomModal, setAddRoomModal] = useState(false)
  const [colorPickerOrg, setColorPickerOrg] = useState<string | null>(null)

  const toast = useToast()
  const queryClient = useQueryClient()

  const { data: rooms = [] } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => getRooms(),
    initialData: initialRooms,
  })

  const { data: knownOrgs = [] } = useQuery({
    queryKey: ['organisations'],
    queryFn: () => getOrganisations(),
  })

  const { data: partenaires = [] } = useQuery({
    queryKey: ['partenaires'],
    queryFn: async () => {
      const list = await getOrganisationsList()
      return list.map((o) => o.name)
    },
  })

  const { data: customColors = {} } = useQuery({
    queryKey: ['orgColors'],
    queryFn: () => getOrgColors(),
  })

  const { data: bookingsData = [] } = useQuery({
    queryKey: ['bookings', currentWeekKey],
    queryFn: () => getBookings(currentWeekKey),
    initialData: currentWeekKey === initialWeekKey ? initialBookings : undefined,
  })

  const deleteBookingMutation = useMutation({
    mutationFn: (id: string) => deleteBooking(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['bookings', currentWeekKey] })
      const previous = queryClient.getQueryData<Booking[]>(['bookings', currentWeekKey])
      queryClient.setQueryData<Booking[]>(
        ['bookings', currentWeekKey],
        (old) => old?.filter((b) => b.id !== id) ?? []
      )
      return { previous }
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['bookings', currentWeekKey], context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings', currentWeekKey] })
      queryClient.invalidateQueries({ queryKey: ['organisations'] })
    },
  })

  const moveBookingMutation = useMutation({
    mutationFn: ({ id, roomId, dayIndex, slot }: {
      id: string; roomId: string; dayIndex: number; slot: number
    }) => moveBooking(id, roomId, dayIndex, slot),
    onMutate: async ({ id, roomId, dayIndex, slot }) => {
      await queryClient.cancelQueries({ queryKey: ['bookings', currentWeekKey] })
      const previous = queryClient.getQueryData<Booking[]>(['bookings', currentWeekKey])
      queryClient.setQueryData<Booking[]>(
        ['bookings', currentWeekKey],
        (old) => old?.map((b) => b.id === id ? { ...b, roomId, dayIndex, slot } : b) ?? []
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['bookings', currentWeekKey], context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings', currentWeekKey] })
    },
  })

  const updateCommentMutation = useMutation({
    mutationFn: ({ id, comment }: { id: string; comment: string | null }) =>
      updateBookingComment(id, comment),
    onMutate: async ({ id, comment }) => {
      await queryClient.cancelQueries({ queryKey: ['bookings', currentWeekKey] })
      const previous = queryClient.getQueryData<Booking[]>(['bookings', currentWeekKey])
      queryClient.setQueryData<Booking[]>(
        ['bookings', currentWeekKey],
        (old) => old?.map((b) => b.id === id ? { ...b, comment } : b) ?? []
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['bookings', currentWeekKey], context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings', currentWeekKey] })
    },
  })

  const addBookingMutation = useMutation({
    mutationFn: ({ roomId, weekKey, dayIndex, slot, organisation }: {
      roomId: string; weekKey: string; dayIndex: number; slot: number; organisation: string
    }) => addBooking(roomId, weekKey, dayIndex, slot, organisation),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings', currentWeekKey] })
      queryClient.invalidateQueries({ queryKey: ['organisations'] })
    },
  })

  const addRoomMutation = useMutation({
    mutationFn: ({ floor, name, capacity }: { floor: string; name: string; capacity?: number }) =>
      addRoom(floor, name, capacity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
    },
  })

  const updateRoomMutation = useMutation({
    mutationFn: ({ id, capacity }: { id: string; capacity: number | null }) =>
      updateRoom(id, { capacity }),
    onMutate: async ({ id, capacity }) => {
      await queryClient.cancelQueries({ queryKey: ['rooms'] })
      const previous = queryClient.getQueryData<Room[]>(['rooms'])
      queryClient.setQueryData<Room[]>(['rooms'], (old) =>
        old?.map((r) => r.id === id ? { ...r, capacity } : r) ?? []
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(['rooms'], context.previous)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
    },
  })

  const copyPrevWeekMutation = useMutation({
    mutationFn: ({ target, source }: { target: string; source: string }) =>
      copyPreviousWeek(target, source),
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['bookings', currentWeekKey] })
      toast.success(count ? `${count} réservation(s) copiée(s)` : 'Aucune réservation à copier')
    },
    onError: () => {
      toast.error('Erreur lors de la copie')
    },
  })

  const { data: templateExists = false } = useQuery({
    queryKey: ['hasTemplate'],
    queryFn: () => hasTemplate(),
  })

  const saveTemplateMutation = useMutation({
    mutationFn: (weekKey: string) => saveWeekAsTemplate(weekKey),
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['hasTemplate'] })
      toast.success(count ? `Modèle enregistré (${count} réservations)` : 'Modèle vide enregistré')
    },
    onError: () => toast.error("Erreur lors de l'enregistrement du modèle"),
  })

  const applyTemplateMutation = useMutation({
    mutationFn: (targetWeekKey: string) => applyTemplateToWeek(targetWeekKey),
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['bookings', currentWeekKey] })
      toast.success(count ? `Modèle appliqué (${count} réservations)` : 'Aucun modèle à appliquer')
    },
    onError: () => toast.error("Erreur lors de l'application du modèle"),
  })

  const deleteRoomMutation = useMutation({
    mutationFn: (id: string) => deleteRoom(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['rooms'] })
      const previous = queryClient.getQueryData<Room[]>(['rooms'])
      queryClient.setQueryData<Room[]>(['rooms'], (old) => old?.filter((r) => r.id !== id) ?? [])
      return { previous }
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['rooms'], context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
      queryClient.invalidateQueries({ queryKey: ['bookings', currentWeekKey] })
    },
  })

  const setOrgColorMutation = useMutation({
    mutationFn: ({ org, color, bg }: { org: string; color: string; bg: string }) =>
      setOrgColor(org, color, bg),
    onMutate: async ({ org, color, bg }) => {
      await queryClient.cancelQueries({ queryKey: ['orgColors'] })
      const previous = queryClient.getQueryData<Record<string, { color: string; bg: string }>>(['orgColors'])
      queryClient.setQueryData<Record<string, { color: string; bg: string }>>(['orgColors'], (old) => ({
        ...old,
        [org]: { color, bg },
      }))
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(['orgColors'], context.previous)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['orgColors'] })
    },
  })

  const deleteOrgColorMutation = useMutation({
    mutationFn: (org: string) => deleteOrgColor(org),
    onMutate: async (org) => {
      await queryClient.cancelQueries({ queryKey: ['orgColors'] })
      const previous = queryClient.getQueryData<Record<string, { color: string; bg: string }>>(['orgColors'])
      const updated = { ...previous }
      delete updated[org]
      queryClient.setQueryData(['orgColors'], updated)
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(['orgColors'], context.previous)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['orgColors'] })
    },
  })

  const allOrgs = [...new Set(bookingsData.map((b) => b.organisation))]

  return (
    <div className="max-w-[1400px] mx-auto px-3 sm:px-6 py-5 sm:py-8">
      <Header
        weekKey={currentWeekKey}
        hasTemplate={templateExists}
        onPrev={() => setCurrentWeekKey((k) => shiftWeek(k, -1))}
        onNext={() => setCurrentWeekKey((k) => shiftWeek(k, 1))}
        onToday={() => setCurrentWeekKey(getWeekKey(new Date()))}
        onAddRoom={() => setAddRoomModal(true)}
        onExportExcel={() => exportPlanningToExcel(rooms, bookingsData, currentWeekKey)}
        onPrint={() => window.open(`/print?week=${currentWeekKey}`, '_blank')}
        onCopyPrevWeek={() => {
          toast.confirm(
            'Copier les réservations de la semaine précédente ? Les réservations existantes seront remplacées.',
            () => {
              copyPrevWeekMutation.mutate({
                target: currentWeekKey,
                source: shiftWeek(currentWeekKey, -1),
              })
            }
          )
        }}
        onSaveAsTemplate={() => {
          toast.confirm(
            'Enregistrer cette semaine comme modèle ? Le modèle précédent sera remplacé.',
            () => saveTemplateMutation.mutate(currentWeekKey)
          )
        }}
        onApplyTemplate={() => {
          toast.confirm(
            'Appliquer le modèle à cette semaine ? Les réservations existantes seront remplacées.',
            () => applyTemplateMutation.mutate(currentWeekKey)
          )
        }}
      />

      <LegendBar
        organisations={allOrgs}
        customColors={customColors}
        onTagClick={(org) => setColorPickerOrg(org)}
      />

      <PlanningGrid
        rooms={rooms}
        bookings={bookingsData}
        weekKey={currentWeekKey}
        customColors={customColors}
        onSlotClick={(roomId, dayIndex, slot) => setBookingModal({ roomId, dayIndex, slot })}
        onDeleteBooking={(id) => deleteBookingMutation.mutate(id)}
        onMoveBooking={(bookingId, roomId, dayIndex, slot) => {
          moveBookingMutation.mutate({ id: bookingId, roomId, dayIndex, slot })
        }}
        onDeleteRoom={(id) => deleteRoomMutation.mutate(id)}
        onUpdateCapacity={(id, capacity) => updateRoomMutation.mutate({ id, capacity })}
        onUpdateComment={(id, comment) => updateCommentMutation.mutate({ id, comment })}
      />

      {bookingModal && (
        <BookingModal
          roomName={rooms.find((r) => r.id === bookingModal.roomId)?.name ?? ''}
          dayIndex={bookingModal.dayIndex}
          slot={bookingModal.slot}
          knownOrganisations={[...new Set([...partenaires, ...knownOrgs])]}
          customColors={customColors}
          onConfirm={(organisation) => {
            addBookingMutation.mutate({
              roomId: bookingModal.roomId,
              weekKey: currentWeekKey,
              dayIndex: bookingModal.dayIndex,
              slot: bookingModal.slot,
              organisation,
            })
            setBookingModal(null)
          }}
          onClose={() => setBookingModal(null)}
        />
      )}

      {addRoomModal && (
        <AddRoomModal
          onConfirm={(floor, name, capacity) => {
            addRoomMutation.mutate({ floor, name, capacity })
            setAddRoomModal(false)
          }}
          onClose={() => setAddRoomModal(false)}
        />
      )}

      {colorPickerOrg && (
        <ColorPickerModal
          organisation={colorPickerOrg}
          currentColor={getOrgColor(colorPickerOrg, customColors)}
          onConfirm={(color, bg) => {
            setOrgColorMutation.mutate({ org: colorPickerOrg, color, bg })
            setColorPickerOrg(null)
          }}
          onReset={() => {
            deleteOrgColorMutation.mutate(colorPickerOrg)
            setColorPickerOrg(null)
          }}
          onClose={() => setColorPickerOrg(null)}
        />
      )}

      <ToastContainer toasts={toast.toasts} onDismiss={toast.dismiss} />
    </div>
  )
}
