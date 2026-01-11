import { auth } from '@/lib/auth'
import { createFileRoute } from '@tanstack/react-router'

/**
 *  Esta ruta actúa como un puente o "API Gateway" para la autenticación. 
 * Al usar el carácter $ (splat/comodín), captura todas las peticiones que empiecen por 
 * /api/auth/ (como /api/auth/sign-in, /api/auth/sign-up, etc.) 
 * y se las pasa directamente a la librería Better Auth para que las procese.
 */



export const Route = createFileRoute('/api/auth/$')({            // Define la ruta comodín (splat) que captura todo bajo /api/auth/
  server: {                                                      // Configuración específica del servidor (TanStack Start)
    handlers: {                                                  // Define los manejadores para los métodos HTTP
      GET: ({ request }) => {                                    // Maneja las peticiones GET entrantes
        return auth.handler(request)                             // Delega el procesamiento a Better Auth (ej. obtener sesión)
      },
      POST: ({ request }) => {                                   // Maneja las peticiones POST entrantes
        return auth.handler(request)                             // Delega el procesamiento a Better Auth (ej. iniciar sesión, registro)
      },
    },
  },
})