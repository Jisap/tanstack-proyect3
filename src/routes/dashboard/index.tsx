import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/')({ // Cuando se accede a /dashboard/ se redirige a /dashboard/items
  beforeLoad: () => {
    throw redirect({ to: '/dashboard/items' })
  },
})


