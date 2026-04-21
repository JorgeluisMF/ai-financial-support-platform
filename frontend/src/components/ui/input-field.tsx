type InputFieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  autoComplete?: string
  placeholder?: string
}

/** Shared class for react-hook-form registered inputs (`register`) */
export const SLATE_INPUT_CLASS =
  'mt-1.5 w-full rounded-xl border border-slate-600/70 bg-slate-950/70 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-indigo-500/70 focus:ring-2 focus:ring-indigo-500/25'

const inputClass = SLATE_INPUT_CLASS

export function InputField({
  label,
  value,
  onChange,
  type = 'text',
  autoComplete,
  placeholder,
}: InputFieldProps) {
  return (
    <label className="block text-sm font-medium text-slate-300">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass}
        autoComplete={autoComplete}
        placeholder={placeholder}
      />
    </label>
  )
}
