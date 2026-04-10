'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getUsers, createUser, updateUserPassword, deleteUser } from '@/server/auth'
import { getEmployees, addEmployee, renameEmployee, deleteEmployee } from '@/server/equipeActions'
import type { User, Employee } from '@/server/schema'
import { useToast, ToastContainer } from '@/components/Toast'
import { EmployeeList } from '@/components/equipe/EmployeeList'

interface Props {
  initialUsers: User[]
  initialEmployees: Employee[]
}

export function EquipeAdminClient({ initialUsers, initialEmployees }: Props) {
  const toast = useToast()
  const queryClient = useQueryClient()

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => getEmployees(),
    initialData: initialEmployees,
  })

  const { data: userList = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => getUsers(),
    initialData: initialUsers,
  })

  // Employee mutations
  const addEmpMut = useMutation({
    mutationFn: (name: string) => addEmployee(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      toast.success('Salarié ajouté')
    },
  })

  const renameEmpMut = useMutation({
    mutationFn: (p: { id: string; name: string }) => renameEmployee(p.id, p.name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      toast.success('Nom modifié')
    },
  })

  const deleteEmpMut = useMutation({
    mutationFn: (id: string) => deleteEmployee(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['employees'] })
      const previous = queryClient.getQueryData<Employee[]>(['employees'])
      queryClient.setQueryData<Employee[]>(['employees'], (old) => old?.filter((e) => e.id !== id) ?? [])
      return { previous }
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(['employees'], ctx.previous)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    },
  })

  // User form
  const [showForm, setShowForm] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRole, setNewRole] = useState<'admin' | 'employee'>('employee')
  const [newEmployeeId, setNewEmployeeId] = useState<string>('')
  const [editingPassword, setEditingPassword] = useState<string | null>(null)
  const [editPassword, setEditPassword] = useState('')

  const createUserMut = useMutation({
    mutationFn: () => createUser(newUsername, newPassword, newRole, newEmployeeId || null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setShowForm(false)
      setNewUsername('')
      setNewPassword('')
      setNewRole('employee')
      setNewEmployeeId('')
      toast.success('Compte créé')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erreur'),
  })

  const updatePasswordMut = useMutation({
    mutationFn: (p: { userId: string; password: string }) => updateUserPassword(p.userId, p.password),
    onSuccess: () => {
      setEditingPassword(null)
      setEditPassword('')
      toast.success('Mot de passe modifié')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erreur'),
  })

  const deleteUserMut = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('Compte supprimé')
    },
  })

  const getEmployeeName = (employeeId: string | null) => {
    if (!employeeId) return '—'
    return employees.find((e) => e.id === employeeId)?.name ?? '—'
  }

  return (
    <div className="max-w-[1000px] mx-auto px-4 py-6 space-y-6">
      <h1 className="text-[22px] font-bold">Équipe</h1>

      <section className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        {/* Employees */}
        <div>
          <EmployeeList
            employees={employees}
            onAdd={(name) => addEmpMut.mutate(name)}
            onRename={(id, name) => renameEmpMut.mutate({ id, name })}
            onDelete={(id) => deleteEmpMut.mutate(id)}
          />
        </div>

        {/* Users */}
        <div className="rounded-lg bg-surface border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[13px] font-semibold">Comptes utilisateurs</h2>
            <button
              onClick={() => setShowForm(!showForm)}
              className="h-7 px-3 text-[12px] font-medium rounded-md bg-accent text-white hover:opacity-90 transition-opacity"
            >
              {showForm ? 'Annuler' : '+ Nouveau'}
            </button>
          </div>

          {showForm && (
            <form
              onSubmit={(e) => { e.preventDefault(); createUserMut.mutate() }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 p-3 rounded-md bg-bg/50 border border-border"
            >
              <div>
                <label className="block text-[11px] text-muted mb-1">Identifiant</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full h-8 px-2 text-[13px] rounded-md border border-border-strong bg-bg focus:outline-none focus:border-accent"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] text-muted mb-1">Mot de passe</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full h-8 px-2 text-[13px] rounded-md border border-border-strong bg-bg focus:outline-none focus:border-accent"
                  required
                  minLength={3}
                />
              </div>
              <div>
                <label className="block text-[11px] text-muted mb-1">Rôle</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as 'admin' | 'employee')}
                  className="w-full h-8 px-2 text-[13px] rounded-md border border-border-strong bg-bg focus:outline-none focus:border-accent"
                >
                  <option value="employee">Utilisateur</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-muted mb-1">Salarié lié</label>
                <select
                  value={newEmployeeId}
                  onChange={(e) => setNewEmployeeId(e.target.value)}
                  className="w-full h-8 px-2 text-[13px] rounded-md border border-border-strong bg-bg focus:outline-none focus:border-accent"
                >
                  <option value="">Aucun</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={createUserMut.isPending}
                  className="h-8 px-3 text-[12px] font-medium rounded-md bg-accent text-white hover:opacity-90 disabled:opacity-50"
                >
                  {createUserMut.isPending ? 'Création...' : 'Créer le compte'}
                </button>
              </div>
            </form>
          )}

          <div className="border border-border rounded-md overflow-hidden">
            <div className="hidden sm:grid grid-cols-[1fr_90px_120px_140px] text-[11px] text-muted border-b border-border bg-bg/40">
              <div className="px-3 py-1.5">Identifiant</div>
              <div className="px-3 py-1.5">Rôle</div>
              <div className="px-3 py-1.5">Salarié</div>
              <div className="px-3 py-1.5">Actions</div>
            </div>
            {userList.map((user) => (
              <div key={user.id} className="border-b border-border last:border-b-0">
                <div className="hidden sm:grid grid-cols-[1fr_90px_120px_140px] text-[13px] items-center">
                  <div className="px-3 py-2 font-medium">{user.username}</div>
                  <div className="px-3 py-2">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      user.role === 'admin' ? 'bg-red-light text-red' : 'bg-accent-light text-accent'
                    }`}>
                      {user.role === 'admin' ? 'admin' : 'utilisateur'}
                    </span>
                  </div>
                  <div className="px-3 py-2 text-muted text-[12px]">{getEmployeeName(user.employeeId)}</div>
                  <div className="px-3 py-2">
                    <UserActions
                      user={user}
                      editingPassword={editingPassword}
                      editPassword={editPassword}
                      setEditingPassword={setEditingPassword}
                      setEditPassword={setEditPassword}
                      onUpdatePassword={(userId, password) => updatePasswordMut.mutate({ userId, password })}
                      onDelete={(id) => { if (confirm(`Supprimer "${user.username}" ?`)) deleteUserMut.mutate(id) }}
                    />
                  </div>
                </div>
                <div className="sm:hidden px-3 py-2.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[13px]">{user.username}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        user.role === 'admin' ? 'bg-red-light text-red' : 'bg-accent-light text-accent'
                      }`}>
                        {user.role === 'admin' ? 'admin' : 'utilisateur'}
                      </span>
                    </div>
                    <span className="text-[11px] text-muted">{getEmployeeName(user.employeeId)}</span>
                  </div>
                  <UserActions
                    user={user}
                    editingPassword={editingPassword}
                    editPassword={editPassword}
                    setEditingPassword={setEditingPassword}
                    setEditPassword={setEditPassword}
                    onUpdatePassword={(userId, password) => updatePasswordMut.mutate({ userId, password })}
                    onDelete={(id) => { if (confirm(`Supprimer "${user.username}" ?`)) deleteUserMut.mutate(id) }}
                  />
                </div>
              </div>
            ))}
            {userList.length === 0 && (
              <div className="px-3 py-6 text-center text-muted text-[13px]">Aucun compte</div>
            )}
          </div>

          <p className="text-[11px] text-muted mt-3">
            Les comptes <b>admin</b> accèdent à tout. Les comptes <b>utilisateur</b> n&apos;accèdent qu&apos;au planning des salles.
          </p>
        </div>
      </section>

      <ToastContainer toasts={toast.toasts} onDismiss={toast.dismiss} />
    </div>
  )
}

function UserActions({ user, editingPassword, editPassword, setEditingPassword, setEditPassword, onUpdatePassword, onDelete }: {
  user: User
  editingPassword: string | null
  editPassword: string
  setEditingPassword: (id: string | null) => void
  setEditPassword: (v: string) => void
  onUpdatePassword: (userId: string, password: string) => void
  onDelete: (id: string) => void
}) {
  if (editingPassword === user.id) {
    return (
      <form
        onSubmit={(e) => { e.preventDefault(); onUpdatePassword(user.id, editPassword) }}
        className="flex items-center gap-1.5"
      >
        <input
          type="password"
          value={editPassword}
          onChange={(e) => setEditPassword(e.target.value)}
          placeholder="Nouveau mdp"
          className="w-24 h-6 px-2 text-[11px] rounded border border-border-strong bg-bg focus:outline-none focus:border-accent"
          required
          minLength={3}
          autoFocus
        />
        <button type="submit" className="text-[11px] text-accent hover:underline">OK</button>
        <button type="button" onClick={() => { setEditingPassword(null); setEditPassword('') }} className="text-[11px] text-muted hover:underline">x</button>
      </form>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <button onClick={() => setEditingPassword(user.id)} className="text-[11px] text-accent hover:underline">
        Mot de passe
      </button>
      {user.username !== 'admin' && (
        <button onClick={() => onDelete(user.id)} className="text-[11px] text-red hover:underline">
          Supprimer
        </button>
      )}
    </div>
  )
}
