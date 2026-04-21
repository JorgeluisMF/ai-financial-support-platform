import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'

import { SLATE_INPUT_CLASS } from '../../components/ui/input-field'
import {
  knowledgeTextFormSchema,
  knowledgeUrlFormSchema,
  type KnowledgeTextFormValues,
  type KnowledgeUrlFormValues,
} from '../schemas/knowledge-forms'

const filePayloadSchema = z.object({
  file: z.custom<File>((v) => v instanceof File, {
    message: 'Select a file',
  }),
})

type FilePayload = z.infer<typeof filePayloadSchema>

type ModalFormProps = {
  isSaving: boolean
  onCancel: () => void
}

type FileFormProps = ModalFormProps & {
  onSubmit: (file: File) => Promise<void>
}

export function KnowledgeFileModalForm({ isSaving, onCancel, onSubmit }: FileFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FilePayload>({
    resolver: zodResolver(filePayloadSchema),
    defaultValues: {},
  })

  const pickedFile = useWatch({ control, name: 'file' })

  return (
    <form
      className="space-y-3"
      onSubmit={handleSubmit(async (data) => {
        await onSubmit(data.file)
      })}
      noValidate
    >
      <Controller
        name="file"
        control={control}
        render={({ field }) => (
          <label className="block rounded-xl border border-dashed border-slate-600/70 bg-slate-950/60 p-3 text-sm text-slate-300">
            <span className="mb-2 block text-xs text-slate-400">Select a file</span>
            <input
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={(event) => field.onChange(event.target.files?.[0] ?? undefined)}
              className="w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-500/20 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-indigo-200"
            />
          </label>
        )}
      />
      {errors.file?.message && <p className="text-xs text-rose-400">{errors.file.message}</p>}
      {pickedFile instanceof File && (
        <p className="text-xs text-emerald-300">File: {pickedFile.name}</p>
      )}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="w-full rounded-xl border border-slate-600/80 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-800/70 disabled:opacity-40"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="w-full rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-950/35 transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSaving ? 'Saving...' : 'Upload'}
        </button>
      </div>
    </form>
  )
}

type UrlFormProps = ModalFormProps & {
  onSubmit: (data: KnowledgeUrlFormValues) => Promise<void>
}

export function KnowledgeUrlModalForm({ isSaving, onCancel, onSubmit }: UrlFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<KnowledgeUrlFormValues>({
    resolver: zodResolver(knowledgeUrlFormSchema),
    defaultValues: { title: '', url: '' },
    mode: 'onBlur',
  })

  return (
    <form
      className="space-y-3"
      onSubmit={handleSubmit(async (data) => {
        await onSubmit(data)
      })}
      noValidate
    >
      <div>
        <input
          {...register('title')}
          className={`${SLATE_INPUT_CLASS} mt-0`}
          placeholder="Content title"
        />
        {errors.title?.message && <p className="mt-1 text-xs text-rose-400">{errors.title.message}</p>}
      </div>
      <div>
        <input
          {...register('url')}
          className={`${SLATE_INPUT_CLASS} mt-0`}
          placeholder="https://"
        />
        {errors.url?.message && <p className="mt-1 text-xs text-rose-400">{errors.url.message}</p>}
      </div>
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="w-full rounded-xl border border-slate-600/80 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-800/70 disabled:opacity-40"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="w-full rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-950/35 transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSaving ? 'Saving...' : 'Add URL'}
        </button>
      </div>
    </form>
  )
}

type TextFormProps = ModalFormProps & {
  onSubmit: (data: KnowledgeTextFormValues) => Promise<void>
}

export function KnowledgeTextModalForm({ isSaving, onCancel, onSubmit }: TextFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<KnowledgeTextFormValues>({
    resolver: zodResolver(knowledgeTextFormSchema),
    defaultValues: { title: '', content: '' },
    mode: 'onBlur',
  })

  return (
    <form
      className="space-y-3"
      onSubmit={handleSubmit(async (data) => {
        await onSubmit(data)
      })}
      noValidate
    >
      <div>
        <input
          {...register('title')}
          className={`${SLATE_INPUT_CLASS} mt-0`}
          placeholder="Internal title"
        />
        {errors.title?.message && <p className="mt-1 text-xs text-rose-400">{errors.title.message}</p>}
      </div>
      <div>
        <textarea
          {...register('content')}
          className={`${SLATE_INPUT_CLASS} mt-0 h-40 resize-none`}
          placeholder="Write the new knowledge here..."
        />
        {errors.content?.message && (
          <p className="mt-1 text-xs text-rose-400">{errors.content.message}</p>
        )}
      </div>
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="w-full rounded-xl border border-slate-600/80 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-800/70 disabled:opacity-40"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="w-full rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-950/35 transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSaving ? 'Saving...' : 'Add text'}
        </button>
      </div>
    </form>
  )
}
