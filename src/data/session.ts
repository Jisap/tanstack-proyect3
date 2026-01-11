import { auth } from '@/lib/auth'
import { redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'

export const getSessionFn = createServerFn({ method: 'GET' }).handler( // Define y exporta una función de servidor (Server Function) para peticiones GET
  async () => {
    const headers = getRequestHeaders()                                // Obtiene las cabeceras de la solicitud actual (necesario para cookies/auth)
    const session = await auth.api.getSession({ headers })             // Verifica y obtiene la sesión del usuario utilizando las cabeceras

    if (!session) {                                                    // Evalúa si no existe una sesión activa
      throw redirect({ to: '/login' })                                 // Si no hay sesión, interrumpe la ejecución y redirige al login
    }

    return session                                                     // Devuelve el objeto de sesión si el usuario está autenticado
  },
) 