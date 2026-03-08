'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getEmployees,
  addEmployee,
  deleteEmployee,
  generateAndSaveSchedule,
} from '@/server/equipeActions'
import { getWeekKey } from '@/lib/weekUtils'
import type { Employee } from '@/server/schema'
import type { GeneratedSchedule } from '@/lib/schedulerEngine'
import { useToast, ToastContainer } from '@/components/Toast'
import { GenerateForm } from './GenerateForm'
import { ScheduleGrid } from './ScheduleGrid'
import { ScheduleSummary } from './ScheduleSummary'
import { EmployeeList } from './EmployeeList'

interface Props {
  initialEmployees: Employee[]
}

export function EquipeClient({ initialEmployees }: Props) {
  const [schedule, setSchedule] = useState<GeneratedSchedule | null>(null)
  const toast = useToast()
  const queryClient = useQueryClient()

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => getEmployees(),
    initialData: initialEmployees,
  })

  const addEmployeeMutation = useMutation({
    mutationFn: (name: string) => addEmployee(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      toast.success('Salarie ajoute')
    },
  })

  const deleteEmployeeMutation = useMutation({
    mutationFn: (id: string) => deleteEmployee(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['employees'] })
      const previous = queryClient.getQueryData<Employee[]>(['employees'])
      queryClient.setQueryData<Employee[]>(['employees'], (old) => old?.filter((e) => e.id !== id) ?? [])
      return { previous }
    },
    onError: (_err, _id, context) => {
      if (context?.previous) queryClient.setQueryData(['employees'], context.previous)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    },
  })

  const generateMutation = useMutation({
    mutationFn: (params: { startDate: string; weeks: number; weekdayHours: number; weekendHours: number }) =>
      generateAndSaveSchedule(params.startDate, params.weeks, params.weekdayHours, params.weekendHours),
    onSuccess: (result) => {
      setSchedule(result)
      const violationCount = result.violations.length
      if (violationCount > 0) {
        toast.error(`Planning genere avec ${violationCount} alerte(s)`)
      } else {
        toast.success('Planning genere avec succes')
      }
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la generation')
    },
  })

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-6">
      <h1 className="font-display text-2xl font-bold tracking-tight mb-6">
        Planning equipe
      </h1>

      <div className="grid grid-cols-[300px_1fr] gap-6">
        {/* Left sidebar */}
        <div className="space-y-6">
          <EmployeeList
            employees={employees}
            onAdd={(name) => addEmployeeMutation.mutate(name)}
            onDelete={(id) => deleteEmployeeMutation.mutate(id)}
          />

          <GenerateForm
            disabled={employees.length < 2}
            loading={generateMutation.isPending}
            onGenerate={(startDate, weeks, weekdayHours, weekendHours) =>
              generateMutation.mutate({ startDate, weeks, weekdayHours, weekendHours })
            }
          />
        </div>

        {/* Main content */}
        <div className="space-y-6">
          {schedule && (
            <>
              <ScheduleSummary
                summary={schedule.summary}
                violations={schedule.violations}
                weeks={schedule.weeks.length}
              />
              <ScheduleGrid schedule={schedule} />
            </>
          )}

          {!schedule && (
            <div className="border border-border rounded-lg bg-surface p-12 text-center text-muted">
              Configurez les parametres et generez le planning
            </div>
          )}
        </div>
      </div>

      <ToastContainer toasts={toast.toasts} onDismiss={toast.dismiss} />
    </div>
  )
}
