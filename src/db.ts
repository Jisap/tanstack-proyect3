import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from './generated/prisma/client'


/* Este archivo configura la conexión a la base de datos utilizando Prisma. */


const adapter = new PrismaPg({                                             // Crea una instancia del adaptador de Postgres
  connectionString: process.env.DATABASE_URL!,                             // Usa la URL de conexión definida en las variables de entorno (.env)
})

declare global {                                                           // Extiende los tipos globales de TypeScript
  var __prisma: PrismaClient | undefined                                   // Define una variable global para almacenar la instancia de Prisma (evita reconexiones en dev)
}

export const prisma = globalThis.__prisma || new PrismaClient({ adapter }) // Exporta la instancia existente (Singleton) o crea una nueva si no existe

if (process.env.NODE_ENV !== 'production') {                               // Solo en entorno de desarrollo...
  globalThis.__prisma = prisma                                             // ...guarda la instancia en la variable global para reutilizarla tras las recargas
} 
