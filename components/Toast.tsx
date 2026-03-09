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
    if (type !== 'confirm') {
      setTimeout(() => dismiss(id), 3000)
    }
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
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  const style =
    toast.type === 'error'
      ? 'bg-red-50 border-red-100 text-red-800'
      : toast.type === 'confirm'
        ? 'bg-amber-50 border-amber-100 text-amber-900'
        : 'bg-emerald-50 border-emerald-100 text-emerald-800'

  return (
    <div
      ref={ref}
      className={`border rounded-xl shadow-lg px-4 py-3 text-[13px] backdrop-blur-xl transition-all duration-200 ${style} ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
    >
      <div className="flex items-start gap-2">
        <span className="flex-1">{toast.message}</span>
        {toast.type !== 'confirm' && (
          <button onClick={() => onDismiss(toast.id)} className="opacity-40 hover:opacity-100 transition-opacity">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M4 4l6 6M10 4l-6 6"/></svg>
          </button>
        )}
      </div>
      {toast.type === 'confirm' && (
        <div className="flex gap-2 mt-2.5">
          <button
            onClick={() => onDismiss(toast.id)}
            className="px-3 py-1 text-xs font-medium rounded-full border border-amber-200 hover:bg-amber-100/50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={() => {
              toast.onConfirm?.()
              onDismiss(toast.id)
            }}
            className="px-3 py-1 text-xs font-medium bg-amber-600 text-white rounded-full hover:bg-amber-700 transition-colors"
          >
            Confirmer
          </button>
        </div>
      )}
    </div>
  )
}
