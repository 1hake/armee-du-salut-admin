'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

type ToastType = 'success' | 'error' | 'confirm'

interface Toast {
  id: number
  message: string
  type: ToastType
  onConfirm?: () => void
}

let idCounter = 0

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const show = useCallback((message: string, type: ToastType = 'success', onConfirm?: () => void) => {
    const id = ++idCounter
    setToasts((prev) => [...prev, { id, message, type, onConfirm }])
    if (type !== 'confirm') setTimeout(() => dismiss(id), 3000)
    return id
  }, [dismiss])

  const success = useCallback((msg: string) => show(msg, 'success'), [show])
  const error = useCallback((msg: string) => show(msg, 'error'), [show])
  const confirm = useCallback((msg: string, onConfirm: () => void) => show(msg, 'confirm', onConfirm), [show])

  return { toasts, dismiss, success, error, confirm }
}

export function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  const colors =
    toast.type === 'error'
      ? 'bg-red-light text-red border-red/10'
      : toast.type === 'confirm'
        ? 'bg-orange-50 text-orange-800 border-orange-100'
        : 'bg-emerald-50 text-emerald-800 border-emerald-100'

  return (
    <div
      className={`border rounded-lg px-3.5 py-2.5 text-[13px] transition-all duration-150 ${colors} ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="flex-1">{toast.message}</span>
        {toast.type !== 'confirm' && (
          <button onClick={() => onDismiss(toast.id)} className="opacity-40 hover:opacity-100 transition-opacity shrink-0">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M4 4l6 6M10 4l-6 6"/></svg>
          </button>
        )}
      </div>
      {toast.type === 'confirm' && (
        <div className="flex gap-2 mt-2">
          <button onClick={() => onDismiss(toast.id)} className="px-3 py-1 text-[12px] font-medium rounded-md border border-border hover:bg-surface-hover transition-colors">
            Annuler
          </button>
          <button
            onClick={() => { toast.onConfirm?.(); onDismiss(toast.id) }}
            className="px-3 py-1 text-[12px] font-medium bg-accent text-white rounded-md hover:opacity-90 transition-opacity"
          >
            Confirmer
          </button>
        </div>
      )}
    </div>
  )
}
