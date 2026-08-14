# Use Get

**[Live demo →](https://use-get.lucianlabs.ca)** · [npm](https://www.npmjs.com/package/@dank-inc/use-get) · [all packages](https://lucianlabs.ca/packages/)

[![https://nodei.co/npm/@dank-inc/use-get.png?downloads=true&downloadRank=true&stars=true](https://nodei.co/npm/@dank-inc/use-get.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/@dank-inc/use-get)

A simple typscript react hook to get you that sweet sweet data from an endpoint. It has a little state manager built in to make things simple.

Forget having to mess up your templates with an ugly useEffect!

All generically typed!

Works with React 17, 18 and 19.

Both hooks return the same discriminated union, so narrowing on `loading` and
`error` leaves you with a non-null `data`:

```ts
type Res<T> =
  | { data: T; error: null; loading: false }
  | { data: null; error: null; loading: true }
  | { data: null; error: string; loading: false }
```

`error` is always a string — the message, never the Error object.

# usePromise

library agnostic data promise handler

It takes a factory and a dependency array rather than a live promise, so it
decides when the promise is created. `deps` works exactly like `useEffect`'s.

```tsx
import { usePromise } from '@dank-inc/use-get'

export const UserPage = ({ teamId }: { teamId: string }) => {
  const { api } = useAppContext()
  const users = usePromise(() => api.getUsers(teamId), [teamId])

  if (users.loading) return <Loading>Getting Users...</Loading>
  if (users.error) return <Error>Couldn't get users. Message: {users.error}</Error>

  return (
    <Page>
      {users.data.map((user) => (
        <UserWidget key={user.id} user={user} />
      ))}
    </Page>
  )
}
```

# useGet

quick n' dirty endpoint getter using `fetch`

Fetches on mount and whenever `path` changes, aborting the request that was
already in flight so a slow earlier response can't land on top of a newer one.
`get` comes back in the result for refetching by hand.

```tsx
import { useGet } from '@dank-inc/use-get'

export const UserPage = () => {
  const users = useGet<User[]>({ path: '/api/users' })

  if (users.loading) return <Loading>Getting Users...</Loading>
  if (users.error) return <Error>Couldn't get users. Message: {users.error}</Error>

  return (
    <Page>
      {users.data.map((user) => (
        <UserWidget key={user.id} user={user} onUpdate={users.get} />
      ))}
    </Page>
  )
}
```

`data` is the parsed response body as-is. If your API wraps its responses, pass
`select` to pull the payload out — nothing is validated, so the type you ask for
is a claim you're making:

```tsx
const users = useGet<User[]>({
  path: '/api/users',
  select: (body) => (body as { data: User[] }).data,
})
```

`init` is handed straight to `fetch`, for method, headers and credentials.
`init` and `select` are read fresh on every request but do not retrigger it —
only `path` does — so writing them inline is safe.
