import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react'

import { ToastContext, type ToastTone } from './toast-context'

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export function TicketCard({
  className,
  ...props
}: HTMLAttributes<HTMLElement>) {
  return <section className={cx('ui-ticket-card', className)} {...props} />
}

type SectionTitleProps = HTMLAttributes<HTMLHeadingElement> & {
  as?: 'h2' | 'h3'
  eyebrow?: string
}

export function SectionTitle({
  as: Heading = 'h2',
  children,
  className,
  eyebrow,
  ...props
}: SectionTitleProps) {
  return (
    <div className="ui-section-heading">
      {eyebrow ? <span className="ui-section-eyebrow">{eyebrow}</span> : null}
      <Heading className={cx('ui-section-title', className)} {...props}>
        {children}
      </Heading>
    </div>
  )
}

type StatTileProps = HTMLAttributes<HTMLDivElement> & {
  label: string
  value: ReactNode
  detail?: ReactNode
}

export function StatTile({
  className,
  detail,
  label,
  value,
  ...props
}: StatTileProps) {
  return (
    <div className={cx('ui-stat-tile', className)} {...props}>
      <span className="ui-stat-label">{label}</span>
      <strong className="ui-stat-value">{value}</strong>
      {detail ? <span className="ui-stat-detail">{detail}</span> : null}
    </div>
  )
}

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  label: string
  description?: string
  error?: string
}

export function TextField({
  className,
  description,
  error,
  id: providedId,
  label,
  required,
  ...props
}: TextFieldProps) {
  const generatedId = useId()
  const id = providedId ?? generatedId
  const descriptionId = description ? `${id}-description` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy =
    [descriptionId, errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className="ui-field">
      <label className="ui-field-label" htmlFor={id}>
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </label>
      {description ? (
        <span className="ui-field-description" id={descriptionId}>
          {description}
        </span>
      ) : null}
      <input
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
        className={cx('ui-input', error && 'ui-input-error', className)}
        id={id}
        required={required}
        {...props}
      />
      {error ? (
        <span className="ui-field-error" id={errorId} role="alert">
          {error}
        </span>
      ) : null}
    </div>
  )
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  busy?: boolean
}

export function Button({
  busy = false,
  children,
  className,
  disabled,
  type = 'button',
  variant = 'primary',
  ...props
}: ButtonProps) {
  return (
    <button
      aria-busy={busy || undefined}
      className={cx('ui-button', `ui-button-${variant}`, className)}
      disabled={disabled || busy}
      type={type}
      {...props}
    >
      {busy ? <span className="ui-spinner" aria-hidden="true" /> : null}
      {children}
    </button>
  )
}

type StatusBadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: 'neutral' | 'success' | 'warning' | 'danger'
}

export function StatusBadge({
  className,
  tone = 'neutral',
  ...props
}: StatusBadgeProps) {
  return (
    <span
      className={cx('ui-status-badge', `ui-status-${tone}`, className)}
      {...props}
    />
  )
}

type DialogProps = {
  open: boolean
  title: string
  children: ReactNode
  onClose: () => void
  actions?: ReactNode
}

export function Dialog({
  actions,
  children,
  onClose,
  open,
  title,
}: DialogProps) {
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    if (!open) return

    const previousFocus = document.activeElement as HTMLElement | null
    const dialog = dialogRef.current

    // Only focus the first focusable element if focus is not already inside the dialog
    if (!dialog?.contains(document.activeElement)) {
      const focusable = dialog?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      focusable?.focus()
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current()
    }
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previousFocus?.focus()
    }
  }, [open])

  if (!open) return null

  return (
    <div className="ui-dialog-backdrop" onMouseDown={onClose}>
      <div
        aria-labelledby={titleId}
        aria-modal="true"
        className="ui-dialog"
        onMouseDown={(event) => event.stopPropagation()}
        ref={dialogRef}
        role="dialog"
      >
        <h2 className="ui-dialog-title" id={titleId}>
          {title}
        </h2>
        <div className="ui-dialog-content">{children}</div>
        {actions ? <div className="ui-dialog-actions">{actions}</div> : null}
      </div>
    </div>
  )
}

type Toast = {
  id: number
  message: string
  tone: ToastTone
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(0)

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const notify = useCallback((message: string, tone: ToastTone = 'neutral') => {
    const id = ++nextId.current
    setToasts((current) => [...current, { id, message, tone }])
  }, [])

  const value = useMemo(() => ({ notify }), [notify])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="ui-toast-region"
        aria-live="polite"
        aria-relevant="additions"
      >
        {toasts.map((toast) => (
          <div
            className={cx('ui-toast', `ui-toast-${toast.tone}`)}
            key={toast.id}
            role={toast.tone === 'danger' ? 'alert' : 'status'}
          >
            <span>{toast.message}</span>
            <button
              aria-label="Xir fariinta"
              className="ui-toast-dismiss"
              onClick={() => dismiss(toast.id)}
              type="button"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

type StateMessageProps = HTMLAttributes<HTMLDivElement> & {
  kind: 'loading' | 'empty' | 'error'
  title: string
  message?: string
  onRetry?: () => void
}

export function StateMessage({
  className,
  kind,
  message,
  onRetry,
  title,
  ...props
}: StateMessageProps) {
  const isLoading = kind === 'loading'

  return (
    <div
      aria-live={isLoading ? 'polite' : undefined}
      className={cx('ui-state', `ui-state-${kind}`, className)}
      role={kind === 'error' ? 'alert' : 'status'}
      {...props}
    >
      {isLoading ? <span className="ui-spinner" aria-hidden="true" /> : null}
      <strong className="ui-state-title">{title}</strong>
      {message ? <p>{message}</p> : null}
      {kind === 'error' && onRetry ? (
        <Button onClick={onRetry} variant="secondary">
          Mar kale isku day
        </Button>
      ) : null}
    </div>
  )
}

export { StarRating } from './StarRating'
