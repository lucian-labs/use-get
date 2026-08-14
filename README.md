# Use Get

**[Live demo →](https://use-get.lucianlabs.ca)** · [npm](https://www.npmjs.com/package/@dank-inc/use-get) · [all packages](https://lucianlabs.ca/packages/)

[![https://nodei.co/npm/@dank-inc/use-get.png?downloads=true&downloadRank=true&stars=true](https://nodei.co/npm/@dank-inc/use-get.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/@dank-inc/use-get)

A simple typscript react hook to get you that sweet sweet data from an endpoint. It has a little state manager built in to make things simple.

Forget having to mess up your templates with an ugly useEffect!

All generically typed!

# usePromise

library agnostic data promise handler

```tsx
import { useGet } from '@dank-inc/use-get'

export const UserPage = () => {
  const { api } = useAppContext()
  const users = usePromise(api.getUsers()) 

  if(users.loading) return <Loading>Getting Users...</Loading>
  if(users.error) return <Error>Coulnd't get users. Message: {error}</Error>

  return (
    <Page>
      {users.map(user => <UserWidget user={user} onUpdate={users.get} />)}
    </Page>
  )
}
```
# useGet

quick n' dirty endpoint getter using `request`

```tsx
import { useGet } from '@dank-inc/use-get'

export const UserPage = () => {
  const users = useGet('users') // uses `request` to get an endpoint
  
  if(users.loading) return <Loading>Getting Users...</Loading>
  if(users.error) return <Error>Coulnd't get users. Message: {error}</Error>

  return (
    <Page>
      {users.map(user => <UserWidget user={user} onUpdate={users.get} />)}
    </Page>
  )
}
```
