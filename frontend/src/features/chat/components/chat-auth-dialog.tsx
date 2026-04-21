import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import type { Path, UseFormRegister } from 'react-hook-form'
import type { ZodIssue } from 'zod'

import { SLATE_INPUT_CLASS } from '../../../components/ui/input-field'
import { GoogleLoginButton } from '../../auth/google-login-button'
import {
  loginFormSchema,
  registerFullSchema,
  registerStepOneSchema,
  type LoginFormValues,
  type RegisterFullValues,
} from '../schemas/auth-forms'

export type RegisterFormPayload = {
  username: string
  email: string
  firstName: string
  lastName: string
  phone: string
  address: string
  identification: string
  password: string
  confirmPassword: string
  acceptedTerms: boolean
}

export type ChatAuthDialogProps = {
  open: boolean
  mode: 'login' | 'register'
  error: string | null
  onClose: () => void
  onModeChange: (mode: 'login' | 'register') => void
  onLoginSubmit: (email: string, password: string) => Promise<void>
  onRegisterSubmit: (payload: RegisterFormPayload) => Promise<void>
}

const REGISTER_DEFAULTS: RegisterFullValues = {
  firstName: '',
  lastName: '',
  username: '',
  email: '',
  phone: '',
  address: '',
  identification: '',
  password: '',
  confirmPassword: '',
  acceptedTerms: false,
}

function setErrorsFromZodIssues(
  setError: (name: Path<RegisterFullValues>, error: { message: string }) => void,
  clearErrors: () => void,
  issues: ZodIssue[],
) {
  clearErrors()
  for (const issue of issues) {
    const key = issue.path[0]
    if (typeof key === 'string' && key) {
      setError(key as Path<RegisterFullValues>, { message: issue.message })
    }
  }
}

function RegisterFieldRow({
  label,
  name,
  register,
  error,
}: {
  label: string
  name: Path<RegisterFullValues>
  register: UseFormRegister<RegisterFullValues>
  error?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300">
        {label}
        <input {...register(name)} className={SLATE_INPUT_CLASS} autoComplete="off" />
      </label>
      {error && <p className="mt-1 text-xs text-rose-400">{error}</p>}
    </div>
  )
}

function toRegisterPayload(values: RegisterFullValues): RegisterFormPayload {
  return {
    username: values.username,
    email: values.email,
    firstName: values.firstName,
    lastName: values.lastName,
    phone: values.phone,
    address: values.address,
    identification: values.identification,
    password: values.password,
    confirmPassword: values.confirmPassword,
    acceptedTerms: values.acceptedTerms,
  }
}

export function ChatAuthDialog({
  open,
  mode,
  error,
  onClose,
  onModeChange,
  onLoginSubmit,
  onRegisterSubmit,
}: ChatAuthDialogProps) {
  const [registerStep, setRegisterStep] = useState<1 | 2>(1)
  const [submittingLogin, setSubmittingLogin] = useState(false)
  const [submittingRegister, setSubmittingRegister] = useState(false)

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { identifier: '', password: '' },
    mode: 'onBlur',
  })

  const registerForm = useForm<RegisterFullValues>({
    resolver: zodResolver(registerFullSchema),
    defaultValues: REGISTER_DEFAULTS,
    mode: 'onBlur',
  })

  const {
    register: regLogin,
    handleSubmit: handleLoginSubmit,
    reset: resetLogin,
    formState: { errors: loginErrors },
  } = loginForm

  const {
    register: regRegister,
    control: registerControl,
    handleSubmit: handleRegisterSubmit,
    reset: resetRegister,
    setError: setRegisterError,
    clearErrors: clearRegisterErrors,
    formState: { errors: registerErrors },
  } = registerForm

  useEffect(() => {
    if (!open) return
    if (mode === 'login') {
      resetLogin({ identifier: '', password: '' })
    } else {
      resetRegister(REGISTER_DEFAULTS)
      setRegisterStep(1)
      clearRegisterErrors()
    }
  }, [open, mode, resetLogin, resetRegister, clearRegisterErrors])

  if (!open) return null

  const onLoginValid = async (values: LoginFormValues) => {
    setSubmittingLogin(true)
    try {
      await onLoginSubmit(values.identifier.trim(), values.password)
    } finally {
      setSubmittingLogin(false)
    }
  }

  const onRegisterValid = async (values: RegisterFullValues) => {
    setSubmittingRegister(true)
    try {
      await onRegisterSubmit(toRegisterPayload(values))
    } finally {
      setSubmittingRegister(false)
    }
  }

  async function goNextRegisterStep() {
    const values = registerForm.getValues()
    const parsed = registerStepOneSchema.safeParse({
      firstName: values.firstName,
      lastName: values.lastName,
      username: values.username,
      email: values.email,
      phone: values.phone,
      address: values.address,
      identification: values.identification,
    })
    if (!parsed.success) {
      setErrorsFromZodIssues(setRegisterError, clearRegisterErrors, parsed.error.issues)
      return
    }
    clearRegisterErrors()
    setRegisterStep(2)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-[3px]">
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md rounded-2xl border border-slate-700/50 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 p-6 shadow-2xl shadow-black/50 ring-1 ring-white/[0.06]"
      >
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-white">
              {mode === 'login' ? 'Sign in' : 'Create account'}
            </h2>
            <p className="mt-1 max-w-[280px] text-sm leading-relaxed text-slate-400">
              {mode === 'login'
                ? 'Access the chat and other protected features.'
                : 'Complete the form to create your account.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-xl p-2 text-slate-400 transition hover:bg-slate-800/90 hover:text-white"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {mode === 'login' ? (
          <div className="space-y-5">
            <GoogleLoginButton className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200/15 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-md shadow-black/20 transition hover:bg-slate-50 hover:shadow-lg active:scale-[0.99]" />

            <div className="relative py-0.5">
              <div className="absolute inset-0 flex items-center" aria-hidden>
                <div className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-gradient-to-b from-slate-900 to-slate-950 px-3 text-xs font-medium text-slate-500">
                  or with your account
                </span>
              </div>
            </div>

            <form className="space-y-4" onSubmit={handleLoginSubmit(onLoginValid)} noValidate>
              <label className="block text-sm font-medium text-slate-300">
                Username or email
                <input
                  {...regLogin('identifier')}
                  autoComplete="username"
                  placeholder="username or email"
                  className={SLATE_INPUT_CLASS}
                />
              </label>
              {loginErrors.identifier && (
                <p className="text-xs text-rose-400">{loginErrors.identifier.message}</p>
              )}
              <label className="block text-sm font-medium text-slate-300">
                Password
                <input
                  {...regLogin('password', { required: true })}
                  type="password"
                  autoComplete="current-password"
                  className={SLATE_INPUT_CLASS}
                />
              </label>
              {loginErrors.password && (
                <p className="text-xs text-rose-400">{loginErrors.password.message}</p>
              )}
              {error && (
                <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={submittingLogin}
                className="w-full rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-950/35 transition hover:bg-indigo-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {submittingLogin ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
            <p className="border-t border-slate-800/90 pt-4 text-center text-sm text-slate-500">
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={() => onModeChange('register')}
                className="font-medium text-indigo-400 hover:text-indigo-300 hover:underline"
              >
                Create one
              </button>
            </p>
          </div>
        ) : (
          <form
            className="space-y-3"
            onSubmit={handleRegisterSubmit(onRegisterValid)}
            noValidate
          >
            <div className="mb-2 rounded-xl border border-slate-700/70 bg-slate-900/55 p-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRegisterStep(1)}
                  className={`rounded-lg px-3 py-2 text-left text-xs transition ${
                    registerStep === 1
                      ? 'bg-indigo-500/20 text-indigo-200 ring-1 ring-indigo-500/40'
                      : 'text-slate-400 hover:bg-slate-800/70'
                  }`}
                >
                  <p className="font-semibold">Paso 1</p>
                  <p className="mt-0.5 text-[0.68rem]">Datos personales</p>
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const step1 = registerForm.getValues()
                    const parsed = registerStepOneSchema.safeParse({
                      firstName: step1.firstName,
                      lastName: step1.lastName,
                      username: step1.username,
                      email: step1.email,
                      phone: step1.phone,
                      address: step1.address,
                      identification: step1.identification,
                    })
                    if (parsed.success) setRegisterStep(2)
                    else setErrorsFromZodIssues(setRegisterError, clearRegisterErrors, parsed.error.issues)
                  }}
                  className={`rounded-lg px-3 py-2 text-left text-xs transition ${
                    registerStep === 2
                      ? 'bg-indigo-500/20 text-indigo-200 ring-1 ring-indigo-500/40'
                      : 'text-slate-400 hover:bg-slate-800/70'
                  }`}
                >
                  <p className="font-semibold">Paso 2</p>
                  <p className="mt-0.5 text-[0.68rem]">Security and confirmation</p>
                </button>
              </div>
            </div>

            {registerStep === 1 ? (
              <div className="rounded-xl border border-slate-700/70 bg-slate-900/45 p-3">
                <div className="mb-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Basic profile
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Complete this information to continue registration.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <RegisterFieldRow
                    label="Nombre"
                    name="firstName"
                    register={regRegister}
                    error={registerErrors.firstName?.message}
                  />
                  <RegisterFieldRow
                    label="Apellido"
                    name="lastName"
                    register={regRegister}
                    error={registerErrors.lastName?.message}
                  />
                  <RegisterFieldRow
                    label="Username"
                    name="username"
                    register={regRegister}
                    error={registerErrors.username?.message}
                  />
                  <RegisterFieldRow
                    label="Email address"
                    name="email"
                    register={regRegister}
                    error={registerErrors.email?.message}
                  />
                  <RegisterFieldRow
                    label="Phone number"
                    name="phone"
                    register={regRegister}
                    error={registerErrors.phone?.message}
                  />
                  <RegisterFieldRow
                    label="Address"
                    name="address"
                    register={regRegister}
                    error={registerErrors.address?.message}
                  />
                  <RegisterFieldRow
                    label="Identification"
                    name="identification"
                    register={regRegister}
                    error={registerErrors.identification?.message}
                  />
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-700/70 bg-slate-900/45 p-3">
                <div className="mb-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Account security
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Set your password and accept the terms to finish.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-300">
                      Password
                      <input
                        {...regRegister('password')}
                        type="password"
                        className={SLATE_INPUT_CLASS}
                        autoComplete="new-password"
                      />
                    </label>
                    {registerErrors.password?.message && (
                      <p className="mt-1 text-xs text-rose-400">{registerErrors.password.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300">
                      Confirm password
                      <input
                        {...regRegister('confirmPassword')}
                        type="password"
                        className={SLATE_INPUT_CLASS}
                        autoComplete="new-password"
                      />
                    </label>
                    {registerErrors.confirmPassword?.message && (
                      <p className="mt-1 text-xs text-rose-400">{registerErrors.confirmPassword.message}</p>
                    )}
                  </div>
                </div>
                <Controller
                  name="acceptedTerms"
                  control={registerControl}
                  render={({ field }) => (
                    <label className="mt-3 flex items-center gap-2 text-xs text-slate-300">
                      <input type="checkbox" checked={field.value} onChange={field.onChange} onBlur={field.onBlur} ref={field.ref} />
                      I accept the terms and conditions
                    </label>
                  )}
                />
                {registerErrors.acceptedTerms?.message && (
                  <p className="mt-1 text-xs text-rose-400">{registerErrors.acceptedTerms.message}</p>
                )}
              </div>
            )}

            {error && <p className="text-xs text-rose-300">{error}</p>}
            <div className="flex items-center gap-2 pt-1">
              {registerStep === 2 && (
                <button
                  type="button"
                  onClick={() => setRegisterStep(1)}
                  className="w-full rounded-xl border border-slate-600/80 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-800/70"
                >
                  Back
                </button>
              )}
              {registerStep === 1 ? (
                <button
                  type="button"
                  onClick={() => void goNextRegisterStep()}
                  className="w-full rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-950/35 transition hover:bg-indigo-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Continue
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={submittingRegister}
                  className="w-full rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-950/35 transition hover:bg-indigo-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {submittingRegister ? 'Creating account…' : 'Create account'}
                </button>
              )}
            </div>
            <p className="border-t border-slate-800/90 pt-4 text-center text-sm text-slate-500">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => onModeChange('login')}
                className="font-medium text-indigo-400 hover:text-indigo-300 hover:underline"
              >
                Sign in
              </button>
            </p>
          </form>
        )}
      </motion.div>
    </div>
  )
}
