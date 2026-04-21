import { describe, expect, it } from 'vitest'

import { hasRole } from './auth-context'

describe('hasRole', () => {
  it('returns true when role is allowed', () => {
    expect(hasRole('admin', ['admin', 'agent'])).toBe(true)
  })

  it('returns false when role is missing', () => {
    expect(hasRole(undefined, ['admin', 'agent'])).toBe(false)
  })
})
