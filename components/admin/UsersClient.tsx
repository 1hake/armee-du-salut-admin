'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getUsers, createUser, updateUserPassword, deleteUser } from '@/server/auth'
import type { User } from '@/server/schema'
import type { Employee } from '@/server/schema'
import { useToast, ToastContainer } from '@/components/Toast'

interface Props {
  initialUsers: User[]
  employees: Employee[]
}

export function UsersClient({ initialUsers, employees }: Props) {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRole, setNewRole] = useState<'admin' | 'employee'>('employee')
  const [newEmployeeId, setNewEmployeeId] = useState<string>('')
  const [editingPassword, setEditingPassword] = useState<string | null>(null)
  const [editPassword, setEditPassword] = useState('')

  const { data: userList = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => getUsers(),
    initialData: initialUsers,
  })

  const createMutation = useMutation({
    mutationFn: () => createUser(newUsername, newPassword, newRole, newEmployeeId || null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setShowForm(false)
      setNewUsername('')
      setNewPassword('')
      setNewRole('employee')
      setNewEmployeeId('')
      toast.success('Compte cree')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erreur'),
  })

  const updatePasswordMutation = useMutation({
    mutationFn: (params: { userId: string; password: string }) =>
      updateUserPassword(params.userId, params.password),
    onSuccess: () => {
      setEditingPassword(null)
      setEditPassword('')
      toast.success('Mot de passe modifie')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erreur'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('Compte supprime')
    },
  })

  const getEmployeeName = (employeeId: string | null) => {
    if (!employeeId) return '—'
    return employees.find((e) => e.id === employeeId)?.name ?? '—'
  }

  return (
    <div className="max-w-[800px] mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[22px] font-bold">Gestion des comptes</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="h-8 px-3 text-[13px] font-medium rounded-md bg-accent text-white hover:opacity-90 transition-opacity"
        >
          {showForm ? 'Annuler' : '+ Nouveau'}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="border border-border rounded-lg p-4 mb-5 animate-in">
          <form
            onSubmit={(e) => { e.preventDefault(); createMutation.mutate() }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
          >
            <div>
              <label className="block text-[12px] text-muted mb-1">Identifiant</label>
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="w-full h-9 px-3 text-[14px] rounded-md border border-border-strong bg-bg focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                required
              />
            </div>
            <div>
              <label className="block text-[12px] text-muted mb-1">Mot de passe</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full h-9 px-3 text-[14px] rounded-md border border-border-strong bg-bg focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                required
                minLength={3}
              />
            </div>
            <div>
              <label className="block text-[12px] text-muted mb-1">Role</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as 'admin' | 'employee')}
                className="w-full h-9 px-3 text-[14px] rounded-md border border-border-strong bg-bg focus:outline-none focus:border-accent"
              >
                <option value="employee">Employe</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-[12px] text-muted mb-1">Salarie lie</label>
              <select
                value={newEmployeeId}
                onChange={(e) => setNewEmployeeId(e.target.value)}
                className="w-full h-9 px-3 text-[14px] rounded-md border border-border-strong bg-bg focus:outline-none focus:border-accent"
              >
                <option value="">Aucun</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2 pt-1">
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="h-8 px-4 text-[13px] font-medium rounded-md bg-accent text-white hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {createMutation.isPending ? 'Creation...' : 'Creer le compte'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* User list */}
      <div className="border border-border rounded-lg overflow-hidden">
        {/* Header - hidden on mobile */}
        <div className="hidden sm:grid grid-cols-[1fr_80px_120px_160px] text-[12px] text-muted border-b border-border bg-surface-hover">
          <div className="px-3 py-2">Identifiant</div>
          <div className="px-3 py-2">Role</div>
          <div className="px-3 py-2">Salarie</div>
          <div className="px-3 py-2">Actions</div>
        </div>
        {userList.map((user) => (
          <div key={user.id} className="border-b border-border last:border-b-0">
            {/* Desktop */}
            <div className="hidden sm:grid grid-cols-[1fr_80px_120px_160px] text-[13px] items-center">
              <div className="px-3 py-2.5 font-medium">{user.username}</div>
              <div className="px-3 py-2.5">
                <span className={`text-[11px] px-1.5 py-0.5 rounded font-medium ${
                  user.role === 'admin' ? 'bg-red-light text-red' : 'bg-accent-light text-accent'
                }`}>{user.role}</span>
              </div>
              <div className="px-3 py-2.5 text-muted text-[12px]">{getEmployeeName(user.employeeId)}</div>
              <div className="px-3 py-2.5">
                <UserActions
                  user={user}
                  editingPassword={editingPassword}
                  editPassword={editPassword}
                  setEditingPassword={setEditingPassword}
                  setEditPassword={setEditPassword}
                  onUpdatePassword={(userId, password) => updatePasswordMutation.mutate({ userId, password })}
                  onDelete={(id) => { if (confirm(`Supprimer "${user.username}" ?`)) deleteMutation.mutate(id) }}
                />
              </div>
            </div>

            {/* Mobile */}
            <div className="sm:hidden px-3 py-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-[14px]">{user.username}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                    user.role === 'admin' ? 'bg-red-light text-red' : 'bg-accent-light text-accent'
                  }`}>{user.role}</span>
                </div>
                <span className="text-[12px] text-muted">{getEmployeeName(user.employeeId)}</span>
              </div>
              <UserActions
                user={user}
                editingPassword={editingPassword}
                editPassword={editPassword}
                setEditingPassword={setEditingPassword}
                setEditPassword={setEditPassword}
                onUpdatePassword={(userId, password) => updatePasswordMutation.mutate({ userId, password })}
                onDelete={(id) => { if (confirm(`Supprimer "${user.username}" ?`)) deleteMutation.mutate(id) }}
              />
            </div>
          </div>
        ))}
        {userList.length === 0 && (
          <div className="px-4 py-8 text-center text-muted text-[14px]">Aucun compte</div>
        )}
      </div>

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
          className="w-28 h-7 px-2 text-[12px] rounded border border-border-strong bg-bg focus:outline-none focus:border-accent"
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
      <button onClick={() => setEditingPassword(user.id)} className="text-[12px] text-accent hover:underline">
        Mot de passe
      </button>
      {user.username !== 'admin' && (
        <button onClick={() => onDelete(user.id)} className="text-[12px] text-red hover:underline">
          Supprimer
        </button>
      )}
    </div>
  )
}
