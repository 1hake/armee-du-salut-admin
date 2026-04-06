'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getEmployees,
  addEmployee,
  renameEmployee,
  deleteEmployee,
  generateSchedulePreview,
  saveSchedule,
  getScheduleOverrides,
  addScheduleOverride,
  deleteScheduleOverride,
} from '@/server/equipeActions'
import type { Employee } from '@/server/schema'
import type { GeneratedSchedule } from '@/lib/schedulerEngine'
import { useToast, ToastContainer } from '@/components/Toast'
import { exportEquipeToExcel } from '@/lib/exportEquipeExcel'
import { GenerateForm } from './GenerateForm'
import { ScheduleGrid } from './ScheduleGrid'
import { ScheduleSummary } from './ScheduleSummary'
import { EmployeeList } from './EmployeeList'
import { ScheduleOverrides } from './ScheduleOverrides'

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

  const { data: overrides = [] } = useQuery({
    queryKey: ['scheduleOverrides'],
    queryFn: () => getScheduleOverrides(),
  })

  const renameEmployeeMutation = useMutation({
    mutationFn: (params: { id: string; name: string }) => renameEmployee(params.id, params.name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      toast.success('Nom modifie')
    },
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

  const addOverrideMutation = useMutation({
    mutationFn: (params: { employeeId: string; date: string; description: string }) =>
      addScheduleOverride(params.employeeId, params.date, params.description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduleOverrides'] })
      toast.success('Changement ajoute')
    },
  })

  const deleteOverrideMutation = useMutation({
    mutationFn: (id: string) => deleteScheduleOverride(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduleOverrides'] })
    },
  })

  const generateMutation = useMutation({
    mutationFn: (params: { startDate: string; cycles?: number }) =>
      generateSchedulePreview(params.startDate, params.cycles),
    onSuccess: (result) => {
      setSchedule(result)
      toast.success(`Planning genere : ${result.weeks.length} semaines (non enregistre)`)
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la generation')
    },
  })

  const saveMutation = useMutation({
    mutationFn: () => saveSchedule(schedule!),
    onSuccess: () => {
      toast.success('Planning enregistre')
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement')
    },
  })

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-6">
      <h1 className="text-[22px] font-bold mb-6">Creer planning</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* Left sidebar */}
        <div className="space-y-4">
          <EmployeeList
            employees={employees}
            onAdd={(name) => addEmployeeMutation.mutate(name)}
            onRename={(id, name) => renameEmployeeMutation.mutate({ id, name })}
            onDelete={(id) => deleteEmployeeMutation.mutate(id)}
          />

          <GenerateForm
            disabled={employees.length !== 5}
            loading={generateMutation.isPending}
            employeeCount={employees.length}
            onGenerate={(startDate, cycles) =>
              generateMutation.mutate({ startDate, cycles })
            }
          />
        </div>

        {/* Main content */}
        <div className="space-y-4">
          {schedule && (
            <>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <ScheduleSummary
                  summary={schedule.summary}
                  weeks={schedule.weeks.length}
                />
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => saveMutation.mutate()}
                    disabled={saveMutation.isPending}
                    className="h-8 px-3.5 text-[13px] font-medium rounded-md bg-accent text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {saveMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                  <button
                    onClick={() => exportEquipeToExcel(schedule)}
                    className="h-8 px-3.5 text-[13px] font-medium rounded-md border border-border-strong hover:bg-surface-hover transition-colors"
                  >
                    Export Excel
                  </button>
                </div>
              </div>
              <ScheduleGrid schedule={schedule} />
            </>
          )}

          <ScheduleOverrides
            overrides={overrides}
            employees={employees}
            onAdd={(employeeId, date, description) =>
              addOverrideMutation.mutate({ employeeId, date, description })
            }
            onDelete={(id) => deleteOverrideMutation.mutate(id)}
          />

          {!schedule && (
            <div className="border border-border rounded-lg p-8 sm:p-16 text-center text-muted text-[14px]">
              Configurez les salaries et generez le planning
            </div>
          )}
        </div>
      </div>

      <ToastContainer toasts={toast.toasts} onDismiss={toast.dismiss} />
    </div>
  )
}
