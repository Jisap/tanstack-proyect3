import { prisma } from "@/db";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma"
import { tanstackStartCookies } from 'better-auth/tanstack-start'


// Exporta la configuración de autenticación de la aplicación
export const auth = betterAuth({
  // En producción usa BETTER_AUTH_URL.
  // En Vercel Preview, usa VERCEL_URL (Vercel no incluye https://, así que lo añadimos).
  baseURL: process.env.BETTER_AUTH_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined),

  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  plugins: [tanstackStartCookies()],
});