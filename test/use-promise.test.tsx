import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, renderHook, waitFor } from '@testing-library/react'
import { usePromise } from '../src'

afterEach(cleanup)

describe('usePromise', () => {
  it('resolves', async () => {
    const { result } = renderHook(() => usePromise(async () => 'ok'))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data).toBe('ok')
  })

  it('settles on a falsy value instead of loading forever', async () => {
    const { result } = renderHook(() => usePromise(async () => 0))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data).toBe(0)
  })

  it('settles once on rejection rather than looping', async () => {
    let calls = 0
    const { result } = renderHook(() =>
      // Written inline on purpose: this is the shape that used to mint a new
      // promise every render and never stop.
      usePromise(async () => {
        calls++
        throw new Error('upstream said no')
      })
    )

    await waitFor(() => expect(result.current.error).toBe('upstream said no'))
    await new Promise((r) => setTimeout(r, 50))
    expect(calls).toBe(1)
  })

  it('runs again when deps change, and reflects the new result', async () => {
    const { result, rerender } = renderHook((id: number) => usePromise(async () => `user-${id}`, [id]), {
      initialProps: 1,
    })

    await waitFor(() => expect(result.current.data).toBe('user-1'))
    rerender(2)
    await waitFor(() => expect(result.current.data).toBe('user-2'))
  })

  it('does not re-run when deps are unchanged', async () => {
    let calls = 0
    const { result, rerender } = renderHook(() =>
      usePromise(async () => {
        calls++
        return 'ok'
      })
    )

    await waitFor(() => expect(result.current.data).toBe('ok'))
    rerender()
    rerender()
    expect(calls).toBe(1)
  })
})
