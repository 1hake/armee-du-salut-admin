'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getRooms, getBookings, addBooking, deleteBooking, addRoom, deleteRoom, copyPreviousWeek } from '@/server/actions'
import { getWeekKey, shiftWeek } from '@/lib/weekUtils'
import type { Room, Booking } from '@/server/schema'
import { Header } from './Header'
import { LegendBar } from './LegendBar'
import { PlanningGrid } from './PlanningGrid'
import { BookingModal } from './modals/BookingModal'
import { AddRoomModal } from './modals/AddRoomModal'
import { useToast, ToastContainer } from './Toast'

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

  const toast = useToast()
  const queryClient = useQueryClient()

  const { data: rooms = [] } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => getRooms(),
    initialData: initialRooms,
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
    },
  })

  const addBookingMutation = useMutation({
    mutationFn: ({ roomId, weekKey, dayIndex, slot, organisation }: {
      roomId: string; weekKey: string; dayIndex: number; slot: number; organisation: string
    }) => addBooking(roomId, weekKey, dayIndex, slot, organisation),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings', currentWeekKey] })
    },
  })

  const addRoomMutation = useMutation({
    mutationFn: ({ floor, name, capacity }: { floor: string; name: string; capacity?: number }) =>
      addRoom(floor, name, capacity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
    },
  })

  const copyPrevWeekMutation = useMutation({
    mutationFn: ({ target, source }: { target: string; source: string }) =>
      copyPreviousWeek(target, source),
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['bookings', currentWeekKey] })
      toast.success(count ? `${count} reservation(s) copiee(s)` : 'Aucune reservation a copier')
    },
    onError: () => {
      toast.error('Erreur lors de la copie')
    },
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

  const allOrgs = [...new Set(bookingsData.map((b) => b.organisation))]

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-6">
      <Header
        weekKey={currentWeekKey}
        onPrev={() => setCurrentWeekKey((k) => shiftWeek(k, -1))}
        onNext={() => setCurrentWeekKey((k) => shiftWeek(k, 1))}
        onToday={() => setCurrentWeekKey(getWeekKey(new Date()))}
        onAddRoom={() => setAddRoomModal(true)}
        onCopyPrevWeek={() => {
          toast.confirm(
            'Copier les reservations de la semaine precedente ? Les reservations existantes seront remplacees.',
            () => {
              copyPrevWeekMutation.mutate({
                target: currentWeekKey,
                source: shiftWeek(currentWeekKey, -1),
              })
            }
          )
        }}
      />

      <LegendBar organisations={allOrgs} />

      <PlanningGrid
        rooms={rooms}
        bookings={bookingsData}
        weekKey={currentWeekKey}
        onSlotClick={(roomId, dayIndex, slot) => setBookingModal({ roomId, dayIndex, slot })}
        onDeleteBooking={(id) => deleteBookingMutation.mutate(id)}
        onDeleteRoom={(id) => deleteRoomMutation.mutate(id)}
      />

      {bookingModal && (
        <BookingModal
          roomName={rooms.find((r) => r.id === bookingModal.roomId)?.name ?? ''}
          dayIndex={bookingModal.dayIndex}
          slot={bookingModal.slot}
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
      <ToastContainer toasts={toast.toasts} onDismiss={toast.dismiss} />
    </div>
  )
}
