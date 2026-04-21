import { useEffect, useRef, type KeyboardEvent } from 'react'

type ChatInputProps = {
  value: string
  onChange: (value: string) => void
  onSend: () => Promise<void> | void
  isSending: boolean
  disabled?: boolean
}

export function ChatInput({ value, onChange, onSend, isSending, disabled }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = '0px'
    const next = Math.min(el.scrollHeight, 160)
    el.style.height = `${next}px`
  }, [value])

  async function handleSubmit() {
    if (disabled) return
    await onSend()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void handleSubmit()
    }
  }

  return (
    <div className="pointer-events-none absolute bottom-3 left-3 right-3 z-10 sm:bottom-4 sm:left-4 sm:right-4">
      <form
        className="pointer-events-auto"
        onSubmit={(event) => {
          event.preventDefault()
          void handleSubmit()
        }}
      >
        <div className="flex w-full items-end gap-2 rounded-full border border-slate-700/70 bg-slate-900/90 px-3 py-2 shadow-[0_8px_24px_rgba(2,6,23,0.45)] backdrop-blur">
          <div className="flex-1 pl-2 sm:pl-3">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              rows={1}
              className="max-h-40 w-full resize-none bg-transparent text-sm leading-relaxed text-slate-100 outline-none placeholder:text-slate-500"
              placeholder="Escribe tu mensaje..."
              onKeyDown={handleKeyDown}
            />
          </div>
          <button
            type="submit"
            disabled={disabled}
            aria-label="Enviar mensaje"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-base font-semibold text-primary-foreground shadow-soft-xl transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
          >
            {isSending ? (
              '…'
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M5 12L19 12M19 12L13 6M19 12L13 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
