'use client'

import { useState, useRef, useEffect } from 'react'
import { getOrgColor } from '@/lib/orgColors'

interface Props {
  bookingId: string
  organisation: string
  comment?: string | null
  customColors?: Record<string, { color: string; bg: string }>
  onDelete: () => void
  onUpdateComment?: (id: string, comment: string | null) => void
}

export function BookingChip({ bookingId, organisation, comment, customColors, onDelete, onUpdateComment }: Props) {
  const { color, bg } = getOrgColor(organisation, customColors)
  const [dragging, setDragging] = useState(false)
  const [small, setSmall] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(comment ?? '')
  const popoverRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    setSmall(organisation.length > 12)
  }, [organisation])

  useEffect(() => {
    setDraft(comment ?? '')
  }, [comment])

  useEffect(() => {
    if (!editing) return
    function onDown(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setEditing(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [editing])

  const hasComment = Boolean(comment && comment.trim())

  function saveComment() {
    const trimmed = draft.trim()
    onUpdateComment?.(bookingId, trimmed.length ? trimmed : null)
    setEditing(false)
  }

  return (
    <span
      className={`group relative inline-flex items-start gap-0.5 px-1.5 py-0.5 rounded-full font-medium leading-tight max-w-full cursor-grab active:cursor-grabbing ${
        dragging ? 'opacity-50' : ''
      }`}
      style={{ backgroundColor: bg, color, fontSize: small ? '9px' : '11px' }}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', bookingId)
        e.dataTransfer.effectAllowed = 'move'
        setDragging(true)
      }}
      onDragEnd={() => setDragging(false)}
    >
      <span ref={textRef} className="break-words overflow-hidden" style={{ wordBreak: 'break-word' }}>
        {organisation}
      </span>

      {onUpdateComment && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            setDraft(comment ?? '')
            setEditing((v) => !v)
          }}
          className={`${hasComment ? 'opacity-100' : 'sm:opacity-0 sm:group-hover:opacity-100'} transition-opacity text-current hover:opacity-70 flex-shrink-0 leading-none mt-px`}
          aria-label={hasComment ? `Modifier le commentaire` : `Ajouter un commentaire`}
          title={hasComment ? comment ?? '' : 'Ajouter un commentaire'}
        >
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1.5 2.5h9v6h-5l-2.5 2v-2h-1.5z" fill={hasComment ? 'currentColor' : 'none'} />
          </svg>
        </button>
      )}

      <button
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
        className="sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-current hover:opacity-70 flex-shrink-0 leading-none mt-px"
        aria-label={`Supprimer ${organisation}`}
      >
        &times;
      </button>

      {editing && (
        <div
          ref={popoverRef}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          className="absolute z-30 top-full left-0 mt-1 bg-surface border border-border rounded-lg shadow-lg p-2 w-56 text-ink"
          style={{ fontSize: '12px' }}
        >
          <textarea
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                saveComment()
              }
              if (e.key === 'Escape') setEditing(false)
            }}
            placeholder="Commentaire…"
            className="w-full text-[12px] border border-border rounded-md px-2 py-1.5 bg-bg focus:outline-none focus:ring-2 focus:ring-accent/20 resize-none"
            rows={3}
          />
          <div className="flex justify-end gap-1.5 mt-1.5">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="px-2 py-1 text-[11px] rounded-md hover:bg-surface-hover text-muted"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={saveComment}
              className="px-2 py-1 text-[11px] rounded-md bg-accent text-white hover:opacity-90"
            >
              Enregistrer
            </button>
          </div>
        </div>
      )}
    </span>
  )
}
