'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getOrganisationsList,
  addOrganisation,
  updateOrganisation,
  deleteOrganisation,
} from '@/server/actions'
import type { Organisation } from '@/server/schema'
import { getOrgColor } from '@/lib/orgColors'
import { useToast, ToastContainer } from '@/components/Toast'

interface Props {
  initialOrgs: Organisation[]
  customColors: Record<string, { color: string; bg: string }>
  bookingCounts: Record<string, number>
}

type OrgFormData = {
  name: string
  shortName: string
  contact: string
  phone: string
  email: string
  notes: string
}

const emptyForm: OrgFormData = { name: '', shortName: '', contact: '', phone: '', email: '', notes: '' }

export function OrganisationsClient({ initialOrgs, customColors, bookingCounts }: Props) {
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingOrg, setEditingOrg] = useState<Organisation | null>(null)
  const [form, setForm] = useState<OrgFormData>(emptyForm)

  const toast = useToast()
  const queryClient = useQueryClient()

  const { data: orgs = [] } = useQuery({
    queryKey: ['organisations'],
    queryFn: () => getOrganisationsList(),
    initialData: initialOrgs,
  })

  const addMutation = useMutation({
    mutationFn: (data: OrgFormData) => addOrganisation({
      name: data.name,
      shortName: data.shortName || undefined,
      contact: data.contact || undefined,
      phone: data.phone || undefined,
      email: data.email || undefined,
      notes: data.notes || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organisations'] })
      toast.success('Partenaire ajoute')
      closeModal()
    },
    onError: () => toast.error('Erreur lors de l\'ajout'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: OrgFormData }) => updateOrganisation(id, {
      name: data.name,
      shortName: data.shortName || undefined,
      contact: data.contact || undefined,
      phone: data.phone || undefined,
      email: data.email || undefined,
      notes: data.notes || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organisations'] })
      toast.success('Partenaire mis a jour')
      closeModal()
    },
    onError: () => toast.error('Erreur lors de la mise a jour'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteOrganisation(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['organisations'] })
      const previous = queryClient.getQueryData<Organisation[]>(['organisations'])
      queryClient.setQueryData<Organisation[]>(['organisations'], (old) => old?.filter((o) => o.id !== id) ?? [])
      return { previous }
    },
    onError: (_err, _id, context) => {
      queryClient.setQueryData(['organisations'], context?.previous)
      toast.error('Erreur lors de la suppression')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organisations'] })
      toast.success('Partenaire supprime')
    },
  })

  function openAdd() {
    setEditingOrg(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEdit(org: Organisation) {
    setEditingOrg(org)
    setForm({
      name: org.name,
      shortName: org.shortName ?? '',
      contact: org.contact ?? '',
      phone: org.phone ?? '',
      email: org.email ?? '',
      notes: org.notes ?? '',
    })
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditingOrg(null)
    setForm(emptyForm)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    if (editingOrg) {
      updateMutation.mutate({ id: editingOrg.id, data: form })
    } else {
      addMutation.mutate(form)
    }
  }

  function handleDelete(org: Organisation) {
    toast.confirm(`Supprimer "${org.name}" ?`, () => deleteMutation.mutate(org.id))
  }

  const filtered = orgs.filter((o) =>
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    (o.shortName && o.shortName.toLowerCase().includes(search.toLowerCase())) ||
    (o.contact && o.contact.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-[1400px] mx-auto px-3 sm:px-6 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-ink">Repertoire des partenaires</h1>
            <p className="text-sm text-muted mt-0.5">{orgs.length} partenaire{orgs.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-ink text-bg rounded-lg hover:opacity-90 transition-opacity shrink-0"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M7 2v10M2 7h10" />
            </svg>
            Ajouter
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="7" cy="7" r="4.5" />
            <path d="M10.5 10.5L14 14" />
          </svg>
          <input
            type="text"
            placeholder="Rechercher un partenaire..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all placeholder:text-muted"
          />
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-muted text-sm">
            {search ? 'Aucun partenaire trouve' : 'Aucun partenaire enregistre'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((org) => {
              const orgColor = getOrgColor(org.name, customColors)
              const count = bookingCounts[org.name] || 0
              return (
                <div
                  key={org.id}
                  className="group bg-surface border border-border rounded-lg p-5 hover:shadow-md transition-all"
                >
                  {/* Top row: tag + actions */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold"
                        style={{ backgroundColor: orgColor.bg, color: orgColor.color }}
                      >
                        {org.name}
                      </span>
                      {org.shortName && (
                        <span className="text-xs text-muted">({org.shortName})</span>
                      )}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={() => openEdit(org)}
                        className="w-7 h-7 flex items-center justify-center rounded-md text-muted hover:text-ink hover:bg-bg transition-colors"
                        title="Modifier"
                      >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9.5 2.5l2 2L4.5 11.5H2.5v-2l7-7z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(org)}
                        className="w-7 h-7 flex items-center justify-center rounded-md text-muted hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Supprimer"
                      >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                          <path d="M2.5 4h9M5 4V2.5h4V4M5.5 6.5v4M8.5 6.5v4M3.5 4l.5 7.5a1 1 0 001 1h4a1 1 0 001-1L10.5 4" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Contact info */}
                  <div className="space-y-1.5 text-sm">
                    {org.contact && (
                      <div className="flex items-center gap-2 text-ink">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" className="text-muted shrink-0">
                          <circle cx="7" cy="4.5" r="2.5" />
                          <path d="M2.5 12c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4" />
                        </svg>
                        {org.contact}
                      </div>
                    )}
                    {org.phone && (
                      <div className="flex items-center gap-2">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" className="text-muted shrink-0">
                          <path d="M2.5 1.5h3l1 3-1.5 1a7 7 0 003.5 3.5l1-1.5 3 1v3c0 .5-.5 1-1 1C5.5 12.5 1.5 8.5 1.5 3c0-.5.5-1 1-1z" />
                        </svg>
                        <a href={`tel:${org.phone}`} className="text-accent hover:underline">{org.phone}</a>
                      </div>
                    )}
                    {org.email && (
                      <div className="flex items-center gap-2">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" className="text-muted shrink-0">
                          <rect x="1.5" y="3" width="11" height="8" rx="1" />
                          <path d="M1.5 4l5.5 4 5.5-4" />
                        </svg>
                        <a href={`mailto:${org.email}`} className="text-accent hover:underline truncate">{org.email}</a>
                      </div>
                    )}
                    {org.notes && (
                      <p className="text-xs text-muted mt-2 leading-relaxed">{org.notes}</p>
                    )}
                  </div>

                  {/* Footer badge */}
                  <div className="mt-3 pt-3 border-t border-border">
                    <span className="text-xs text-muted">
                      {count} reservation{count !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-[2px]" onClick={closeModal}>
          <div
            className="bg-surface rounded-t-2xl sm:rounded-xl shadow-xl w-full sm:max-w-md animate-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 sm:px-6 sm:pt-6 pb-3">
              <h2 className="font-display text-lg font-bold">
                {editingOrg ? 'Modifier le partenaire' : 'Nouveau partenaire'}
              </h2>
              <button
                onClick={closeModal}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-muted hover:text-ink hover:bg-bg transition-colors -mr-1 -mt-1"
                aria-label="Fermer"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4l8 8M12 4l-8 8" /></svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-5 sm:px-6 pb-5 sm:pb-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted mb-1 uppercase tracking-wider">Nom *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 text-sm bg-bg border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                  placeholder="Nom du partenaire"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1 uppercase tracking-wider">Nom court</label>
                <input
                  type="text"
                  value={form.shortName}
                  onChange={(e) => setForm((f) => ({ ...f, shortName: e.target.value }))}
                  className="w-full px-3 py-2 text-sm bg-bg border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                  placeholder="Abreviation"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1 uppercase tracking-wider">Contact</label>
                <input
                  type="text"
                  value={form.contact}
                  onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))}
                  className="w-full px-3 py-2 text-sm bg-bg border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                  placeholder="Nom du contact"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1 uppercase tracking-wider">Telephone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    className="w-full px-3 py-2 text-sm bg-bg border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                    placeholder="01 23 45 67 89"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1 uppercase tracking-wider">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="w-full px-3 py-2 text-sm bg-bg border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                    placeholder="email@exemple.fr"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1 uppercase tracking-wider">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 text-sm bg-bg border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all resize-none"
                  placeholder="Notes supplementaires..."
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-bg transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={addMutation.isPending || updateMutation.isPending}
                  className="px-4 py-2 text-sm bg-ink text-bg rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {editingOrg ? 'Enregistrer' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ToastContainer toasts={toast.toasts} onDismiss={toast.dismiss} />
    </div>
  )
}
