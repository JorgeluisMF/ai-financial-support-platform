import { useEffect, useState } from 'react'

import {
  addTextKnowledge,
  addUrlKnowledge,
  deleteKnowledge,
  getKnowledge,
  uploadKnowledgeFile,
} from '../services/api'
import type { KnowledgeItem } from '../lib/api/types'
import { useChatStore } from '../store/chat-store'

import { KnowledgeActionCard } from './components/knowledge-action-card'
import type { KnowledgeModalKind } from './components/knowledge-edit-modal'
import type { KnowledgeTextFormValues, KnowledgeUrlFormValues } from './schemas/knowledge-forms'
import { KnowledgeEditModal } from './components/knowledge-edit-modal'
import { KnowledgeFeedbackBanner } from './components/knowledge-feedback-banner'
import { KnowledgePageHeader } from './components/knowledge-page-header'
import { KnowledgeSourcesSection } from './components/knowledge-sources-section'

export function KnowledgeTrainingPage() {
  const clearLocalResponseCache = useChatStore((state) => state.clearLocalResponseCache)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [items, setItems] = useState<KnowledgeItem[]>([])
  const [isLoadingItems, setIsLoadingItems] = useState(false)
  const [activeModal, setActiveModal] = useState<KnowledgeModalKind | null>(null)

  async function loadKnowledge() {
    setIsLoadingItems(true)
    try {
      const data = await getKnowledge()
      setItems(data.items)
    } finally {
      setIsLoadingItems(false)
    }
  }

  useEffect(() => {
    void loadKnowledge()
  }, [])

  async function runUpdate(action: () => Promise<void>, message: string): Promise<boolean> {
    setIsSaving(true)
    setError(null)
    setSuccess(null)
    try {
      await action()
      await loadKnowledge()
      setSuccess(message)
      return true
    } catch {
      setError('Could not update knowledge. Please try again.')
      return false
    } finally {
      setIsSaving(false)
    }
  }

  async function handleSubmitText(data: KnowledgeTextFormValues) {
    const ok = await runUpdate(
      () => addTextKnowledge({ title: data.title, content: data.content }),
      'Text added successfully.',
    )
    if (ok) setActiveModal(null)
  }

  async function handleSubmitUrl(data: KnowledgeUrlFormValues) {
    const ok = await runUpdate(
      () => addUrlKnowledge({ title: data.title, url: data.url }),
      'Link added successfully.',
    )
    if (ok) setActiveModal(null)
  }

  async function handleSubmitFile(file: File) {
    const ok = await runUpdate(() => uploadKnowledgeFile(file), 'Document uploaded successfully.')
    if (ok) setActiveModal(null)
  }

  function handleDeleteItem(item: KnowledgeItem) {
    void runUpdate(() => deleteKnowledge(item.id), 'Source removed successfully.').then((ok) => {
      if (ok) {
        clearLocalResponseCache(item.source_ref)
      }
    })
  }

  return (
    <div className="space-y-6">
      <KnowledgePageHeader />

      <section className="grid gap-4 lg:grid-cols-3">
        <KnowledgeActionCard
          title="Upload documents"
          description="Upload PDF, DOCX, or TXT files to index official knowledge."
          buttonLabel="Upload document"
          onOpen={() => setActiveModal('file')}
        />
        <KnowledgeActionCard
          title="Add URL"
          description="Link reference pages to keep content continuously updated."
          buttonLabel="Add URL"
          onOpen={() => setActiveModal('url')}
        />
        <KnowledgeActionCard
          title="Manual text"
          description="Add internal procedures and operational clarifications directly."
          buttonLabel="Add text"
          onOpen={() => setActiveModal('text')}
        />
      </section>

      <KnowledgeFeedbackBanner error={error} success={success} />

      <KnowledgeSourcesSection
        items={items}
        isLoadingItems={isLoadingItems}
        onReload={() => void loadKnowledge()}
        onDelete={handleDeleteItem}
      />

      {activeModal && (
        <KnowledgeEditModal
          activeModal={activeModal}
          isSaving={isSaving}
          onClose={() => setActiveModal(null)}
          onSubmitUrl={handleSubmitUrl}
          onSubmitText={handleSubmitText}
          onSubmitFile={handleSubmitFile}
        />
      )}
    </div>
  )
}
