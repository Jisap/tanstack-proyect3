import { createMiddleware, createStart } from '@tanstack/react-start'
import { authMiddleware } from './middlewares/auth'

// Este archivo se activa solo automaticamente


// Sirve para depuración (debugging).
// Intercepta la solicitud, lee la URL, imprime el mensaje y luego usa next() para no bloquear el flujo.
const loggingMiddleware = createMiddleware({ type: 'request' }).server(
  ({ request, next }) => {
    const url = new URL(request.url)

    console.log(`[${request.method}] ${url.pathname}`)

    return next()
  },
)

// Aquí es donde se "enciende" el motor de TanStack Start y se aplican las reglas globales:
// 1º se registra la visita 2º se aplica el middleware de protección de rutas
export const startInstance = createStart(() => {
  return {
    requestMiddleware: [loggingMiddleware, authMiddleware],
  }
})