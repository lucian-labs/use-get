import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { useGet } from '../src'

type Stub = { ok?: boolean; statusText?: string; body?: unknown }

/** Replaces global fetch and records every URL it is asked for. */
const stubFetch = () => {
  const urls: string[] = []
  let next: Stub = { ok: true, body: [] }

  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      urls.push(String(input))
      return {
        ok: next.ok ?? true,
        statusText: next.statusText ?? 'OK',
        json: async () => next.body,
      }
    })
  )

  return { urls, respond: (stub: Stub) => (next = stub) }
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('useGet', () => {
  it('requests the path it was handed', async () => {
    const { urls } = stubFetch()
    const { result } = renderHook(() => useGet<unknown[]>({ path: '/api/users' }))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(urls).toEqual(['/api/users'])
  })

  it('refetches the new path when path changes', async () => {
    const { urls } = stubFetch()
    const { result, rerender } = renderHook((path: string) => useGet<unknown[]>({ path }), {
      initialProps: '/api/users',
    })

    await waitFor(() => expect(result.current.loading).toBe(false))
    rerender('/api/posts')
    await waitFor(() => expect(urls).toEqual(['/api/users', '/api/posts']))
  })

  it('settles on a falsy payload instead of loading forever', async () => {
    const { respond } = stubFetch()
    respond({ ok: true, body: 0 })

    const { result } = renderHook(() => useGet<number>({ path: '/api/unread' }))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data).toBe(0)
    expect(result.current.error).toBe(null)
  })

  it('uses the body as-is, and select when given', async () => {
    const { respond } = stubFetch()
    respond({ ok: true, body: { data: ['alice'] } })

    const bare = renderHook(() => useGet<{ data: string[] }>({ path: '/api/users' }))
    await waitFor(() => expect(bare.result.current.data).toEqual({ data: ['alice'] }))

    const unwrapped = renderHook(() =>
      useGet<string[]>({
        path: '/api/users',
        select: (body) => (body as { data: string[] }).data,
      })
    )
    await waitFor(() => expect(unwrapped.result.current.data).toEqual(['alice']))
  })

  it('surfaces a failed refetch instead of keeping stale data', async () => {
    const { respond } = stubFetch()
    respond({ ok: true, body: ['alice'] })

    const { result } = renderHook(() => useGet<string[]>({ path: '/api/users' }))
    await waitFor(() => expect(result.current.data).toEqual(['alice']))

    respond({ ok: false, statusText: 'Internal Server Error' })
    await act(async () => {
      await result.current.get()
    })

    expect(result.current.data).toBe(null)
    expect(result.current.error).toBe('Internal Server Error')
    expect(result.current.loading).toBe(false)
  })

  it('reports the error as a string, not an Error instance', async () => {
    const { respond } = stubFetch()
    respond({ ok: false, statusText: 'Not Found' })

    const { result } = renderHook(() => useGet<unknown>({ path: '/api/nope' }))

    await waitFor(() => expect(result.current.error).toBe('Not Found'))
    expect(typeof result.current.error).toBe('string')
  })
})
