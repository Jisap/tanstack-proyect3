import { auth } from '@/lib/auth'
import { redirect } from '@tanstack/react-router'
import { createMiddleware } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'


// Este middleware está diseñado para proteger Server Functions (creadas don createSeverFn)
// Asegura que quien llama a una funciónespecífica esté autenticado
export const authFnMiddleware = createMiddleware({ type: 'function' }).server(
  async ({ next }) => {
    const headers = getRequestHeaders()                     // Obtenemos los headers de la petición
    const session = await auth.api.getSession({ headers })  // Obtenemos la sesión

    if (!session) {                                         // Si no hay sesión, redirigimos al login
      throw redirect({ to: '/login' })
    }

    return next({ context: { session } })                   // Si hay sesión, continuamos
  },
)

// Este middleware está diseñado para proteger Rutas o Solicitudes HTTP a nivel global o de enrutador.
// Se ejecuta en el cliclo de vida de la petición http y protege las páginas del panel de control
export const authMiddleware = createMiddleware({ type: 'request' }).server(
  async ({ next, request }) => {
    const url = new URL(request.url)                        // Obtenemos la url de la petición

    if (                                                    // Si la url no empieza con /dashboard o /api/ai (rutas protegidas)
      !url.pathname.startsWith('/dashboard') &&
      !url.pathname.startsWith('/api/ai')
    ) {
      return next()                                         // deja pasar la solicitud
    }

    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })

    if (!session) {                                         // Si no hay sesión, redirigimos al login
      throw redirect({ to: '/login' })
    }

    return next({ context: { session } })
  },
)
