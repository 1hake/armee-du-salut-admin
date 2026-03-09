'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getEmployees,
  addEmployee,
  deleteEmployee,
  generateAndSaveSchedule,
} from '@/server/equipeActions'
import type { Employee } from '@/server/schema'
import type { GeneratedSchedule } from '@/lib/schedulerEngine'
import { useToast, ToastContainer } from '@/components/Toast'
import { exportEquipeToExcel } from '@/lib/exportEquipeExcel'
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
    mutationFn: (params: { startDate: string; weeks?: number }) =>
      generateAndSaveSchedule(params.startDate, params.weeks),
    onSuccess: (result) => {
      setSchedule(result)
      const violationCount = result.violations.length
      if (violationCount > 0) {
        toast.error(`Planning genere avec ${violationCount} alerte(s)`)
      } else {
        toast.success(`Planning genere : cycle de ${result.cycleLength} semaines`)
      }
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la generation')
    },
  })

  return (
    <div className="max-w-[1400px] mx-auto px-3 sm:px-6 py-5 sm:py-8">
      <h1 className="text-2xl sm:text-[28px] font-semibold tracking-tight mb-5 sm:mb-8">
        Planning equipe
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5 sm:gap-8">
        {/* Left sidebar */}
        <div className="space-y-5">
          <EmployeeList
            employees={employees}
            onAdd={(name) => addEmployeeMutation.mutate(name)}
            onDelete={(id) => deleteEmployeeMutation.mutate(id)}
          />

          <GenerateForm
            disabled={employees.length < 2}
            loading={generateMutation.isPending}
            employeeCount={employees.length}
            onGenerate={(startDate, weeks) =>
              generateMutation.mutate({ startDate, weeks })
            }
          />
        </div>

        {/* Main content */}
        <div className="space-y-5">
          {schedule && (
            <>
              <div className="flex items-center justify-between">
                <ScheduleSummary
                  summary={schedule.summary}
                  violations={schedule.violations}
                  weeks={schedule.weeks.length}
                />
                <button
                  onClick={() => exportEquipeToExcel(schedule)}
                  className="px-4 py-2 text-[13px] font-medium rounded-full border border-border hover:bg-surface transition-colors flex-shrink-0 h-fit active:scale-95"
                >
                  Export Excel
                </button>
              </div>
              <ScheduleGrid schedule={schedule} />
            </>
          )}

          {!schedule && (
            <div className="rounded-xl bg-surface border border-border/60 shadow-sm p-8 sm:p-16 text-center text-muted text-[15px]">
              Configurez les parametres et generez le planning
            </div>
          )}
        </div>
      </div>

      <ToastContainer toasts={toast.toasts} onDismiss={toast.dismiss} />
    </div>
  )
}
