import type { KnowledgeTextFormValues, KnowledgeUrlFormValues } from '../schemas/knowledge-forms'

import {
  KnowledgeFileModalForm,
  KnowledgeTextModalForm,
  KnowledgeUrlModalForm,
} from './knowledge-modal-forms'

export type KnowledgeModalKind = 'file' | 'url' | 'text'

type KnowledgeEditModalProps = {
  activeModal: KnowledgeModalKind
  isSaving: boolean
  onClose: () => void
  onSubmitUrl: (data: KnowledgeUrlFormValues) => Promise<void>
  onSubmitText: (data: KnowledgeTextFormValues) => Promise<void>
  onSubmitFile: (file: File) => Promise<void>
}

export function KnowledgeEditModal({
  activeModal,
  isSaving,
  onClose,
  onSubmitUrl,
  onSubmitText,
  onSubmitFile,
}: KnowledgeEditModalProps) {
  const modalTitle =
    activeModal === 'file'
      ? 'Upload document'
      : activeModal === 'url'
        ? 'Add URL'
        : 'Add manual text'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget && !isSaving) onClose()
      }}
    >
      <div className="w-full max-w-lg rounded-2xl border border-slate-700/70 bg-slate-900 p-5 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Knowledge management</p>
            <h3 className="mt-1 text-lg font-semibold text-slate-100">{modalTitle}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white disabled:opacity-40"
            aria-label="Close modal"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {activeModal === 'file' && (
          <KnowledgeFileModalForm isSaving={isSaving} onCancel={onClose} onSubmit={onSubmitFile} />
        )}

        {activeModal === 'url' && (
          <KnowledgeUrlModalForm isSaving={isSaving} onCancel={onClose} onSubmit={onSubmitUrl} />
        )}

        {activeModal === 'text' && (
          <KnowledgeTextModalForm isSaving={isSaving} onCancel={onClose} onSubmit={onSubmitText} />
        )}
      </div>
    </div>
  )
}
