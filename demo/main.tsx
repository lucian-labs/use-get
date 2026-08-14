/* use-get demo — https://use-get.lucianlabs.ca
 *
 * This page runs the published hooks against a real endpoint (takes.json,
 * served next to the page) and prints exactly what they return, including the
 * URL the hook actually requested. Nothing here is mocked or narrated — every
 * panel is live state read off the hook.
 */

import { StrictMode, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { useGet, usePromise } from '@dank-inc/use-get'

/* ── request tap ────────────────────────────────────────────────────────── */

/** Records the URL each fetch actually goes to, so the demo can show the
 *  request the hook issued next to the path it was handed. */
const requests: string[] = []
const nativeFetch = window.fetch.bind(window)
window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
  requests.push(new URL(url, location.href).href)
  return nativeFetch(input as RequestInfo, init)
}) as typeof window.fetch

/* ── small view helpers, in the waveloop language ───────────────────────── */

type Take = { id: string; name: string; bars: number; sealed: boolean }

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  // @ts-expect-error — waveloop custom elements are not in JSX.IntrinsicElements
  <wl-section title={title}>{children}</wl-section>
)

const Readout = ({ label, value }: { label: string; value: string }) => (
  // @ts-expect-error — custom element
  <wl-readout label={label} value={value} />
)

const Code = ({ children }: { children: string }) => (
  <pre className="wl-code">{children}</pre>
)

/** Render the discriminated union the same way a consumer would branch on it. */
const StateBadge = ({ state }: { state: { data: unknown; error: unknown; loading: boolean } }) => {
  const kind = state.loading ? 'loading' : state.error ? 'error' : 'data'
  const colour = kind === 'error' ? 'var(--wl-rec)' : kind === 'loading' ? 'var(--wl-muted)' : 'var(--wl-accent-hi)'
  return (
    <span className="wl-badge" style={{ color: colour, borderColor: colour }}>
      {kind}
    </span>
  )
}

/* ── useGet ─────────────────────────────────────────────────────────────── */

const UseGetPanel = () => {
  const [path, setPath] = useState('takes.json')
  const res = useGet<Take[]>({ path })

  const lastRequest = requests[requests.length - 1] ?? '—'

  return (
    <Section title="useGet">
      <p className="wl-muted">
        The hook takes a path and returns the union. Fetching starts on mount and re-runs when the
        path changes; <code>get</code> comes back in the result so you can refetch by hand.
      </p>

      <Code>{`const takes = useGet<Take[]>({ path: '${path}' })

if (takes.loading) return <Spinner />
if (takes.error) return <Error msg={takes.error} />
return <List items={takes.data} />`}</Code>

      <div className="wl-row" style={{ marginTop: '0.75rem' }}>
        <span className="wl-silk">path</span>
        <input
          value={path}
          spellCheck={false}
          onChange={(e) => setPath(e.target.value)}
          style={{
            flex: 1,
            minWidth: 180,
            padding: '0.55rem 0.75rem',
            border: '1px solid var(--wl-line)',
            background: 'var(--wl-bg-deep)',
            color: 'var(--wl-text)',
            fontFamily: 'var(--wl-font-mono)',
          }}
        />
        <button className="wl-btn" onClick={() => res.get()}>
          refetch
        </button>
        <StateBadge state={res} />
      </div>

      <div className="wl-grid" style={{ marginTop: '0.75rem' }}>
        <Readout label="path passed in" value={path} />
        <Readout label="url actually requested" value={lastRequest} />
        <Readout label="loading" value={String(res.loading)} />
        <Readout label="error" value={res.error ? String(res.error) : '—'} />
      </div>

      <div style={{ marginTop: '0.75rem' }}>
        <Code>{`// hook result\n${JSON.stringify(
          { data: res.data, error: res.error ? String(res.error) : null, loading: res.loading },
          null,
          2
        )}`}</Code>
      </div>
    </Section>
  )
}

/* ── usePromise ─────────────────────────────────────────────────────────── */

const UsePromisePanel = () => {
  const [nonce, setNonce] = useState(0)
  const [shouldFail, setShouldFail] = useState(false)

  // The hook takes a promise, so the promise must be stable across renders —
  // useMemo is the only way to call it without handing it a new promise every
  // render.
  const promise = useMemo(() => {
    void nonce
    return new Promise<{ ok: true; at: string }>((resolve, reject) =>
      setTimeout(() => {
        shouldFail ? reject(new Error('upstream said no')) : resolve({ ok: true, at: new Date().toISOString() })
      }, 600)
    )
  }, [nonce, shouldFail])

  const res = usePromise(promise)

  return (
    <Section title="usePromise">
      <p className="wl-muted">
        The same union over any promise you already have — a client method, a dynamic import,
        anything. Because it takes the promise rather than a factory, the promise has to be memoised
        by the caller.
      </p>

      <Code>{`const promise = useMemo(() => api.getTakes(), [id])
const takes = usePromise(promise)`}</Code>

      <div className="wl-row" style={{ marginTop: '0.75rem' }}>
        <button className="wl-btn" onClick={() => setNonce((n) => n + 1)}>
          new promise
        </button>
        <button
          className="wl-btn wl-btn--ghost"
          onClick={() => {
            setShouldFail((f) => !f)
            setNonce((n) => n + 1)
          }}
        >
          {shouldFail ? 'make it resolve' : 'make it reject'}
        </button>
        <StateBadge state={res} />
      </div>

      <div style={{ marginTop: '0.75rem' }}>
        <Code>{`// hook result\n${JSON.stringify(
          { data: res.data, error: res.error ? String(res.error) : null, loading: res.loading },
          null,
          2
        )}`}</Code>
      </div>
    </Section>
  )
}

/* ── page ───────────────────────────────────────────────────────────────── */

const Api = () => (
  <Section title="api">
    <div className="wl-api__scroll">
      <table className="wl-api">
        <thead>
          <tr>
            <th>export</th>
            <th>kind</th>
            <th>signature</th>
            <th>what it does</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>useGet</td>
            <td>hook</td>
            <td>{'<T>({ path }: { path: string }) => Res<T> & { get }'}</td>
            <td>Fetches on mount and whenever path changes; unwraps the response body’s data field.</td>
          </tr>
          <tr>
            <td>usePromise</td>
            <td>hook</td>
            <td>{'<T>(promise: Promise<T>) => Res<T>'}</td>
            <td>Same union over a promise you already hold.</td>
          </tr>
          <tr>
            <td>Res&lt;T&gt;</td>
            <td>type</td>
            <td>
              {'{ data: T; error: null; loading: false } | { data: null; error: null; loading: true } | { data: null; error: string; loading: false }'}
            </td>
            <td>Discriminated union — narrowing on loading and error gives you a non-null data.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </Section>
)

const Install = () => (
  <Section title="install">
    {/* @ts-expect-error — custom element */}
    <wl-install pkg="@dank-inc/use-get" />
    <div style={{ marginTop: '0.75rem' }}>
      <Code>{`import { useGet, usePromise } from '@dank-inc/use-get'`}</Code>
    </div>
  </Section>
)

const App = () => (
  <>
    <Install />
    <UseGetPanel />
    <UsePromisePanel />
    <Api />
  </>
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
