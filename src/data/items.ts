import { prisma } from "@/db";
import { firecrawl } from "@/lib/firecrawl";
import { bulkImportSchema, extractSchema, importSchema } from "@/schemas/import";
import { createServerFn } from "@tanstack/react-start";
import { authFnMiddleware } from "@/middlewares/auth";
import z from "zod";
import { notFound } from "@tanstack/react-router";
import { generateText } from "ai";
import { openrouter } from "@/lib/openRouter";




export const scrapeUrlFn = createServerFn({ method: 'POST' })
  .middleware([authFnMiddleware])
  .inputValidator(importSchema)
  .handler(async ({ data, context }) => {

    const item = await prisma.savedItem.create({
      data: {
        url: data.url,
        userId: context.session.user.id,
        status: "PROCESSING"
      },
    });

    try {
      const result = await firecrawl.scrape(
        data.url,
        {
          formats: ["markdown", {
            type: "json",
            schema: extractSchema
            //prompt: 'please extract the author and also publishedAt timestamp',
          }],
          location: { country: 'US', languages: ['en'] },
          onlyMainContent: true,
          proxy: "auto",
        }
      )

      const jsonData = result.json as z.infer<typeof extractSchema> // Tiene como objetivo darle un tipo de dato conocido (tipado) a la respuesta que viene de firecrawl

      let publishedAt = null

      if (jsonData.publishedAt) {
        const parsed = new Date(jsonData.publishedAt)

        if (!isNaN(parsed.getTime())) {
          publishedAt = parsed
        }
      }

      const updatedItem = await prisma.savedItem.update({
        where: {
          id: item.id
        },
        data: {
          title: result.metadata?.title || null,
          content: result.markdown || null,
          ogImage: result.metadata?.ogImage || null,
          author: jsonData.author || null,
          publishedAt: publishedAt,
          status: "COMPLETED"
        }
      })

      return updatedItem

    } catch (error) {
      const failedItem = await prisma.savedItem.update({
        where: {
          id: item.id,
        },
        data: {
          status: 'FAILED',
        },
      })
      return failedItem
    }
  });

// get all urls on the website
export const mapUrlFn = createServerFn({ method: 'POST' })
  .middleware([authFnMiddleware])
  .inputValidator(bulkImportSchema)
  .handler(async ({ data }) => {
    const result = await firecrawl.map(data.url, {
      limit: 25,
      search: data.search,
      location: { country: 'US', languages: ['en'] },
    })

    return result.links
  })

export type BulkScrapeProgress = {
  completed: number
  total: number
  url: string
  status: 'success' | 'failed'
}

export const bulkScrapeUrlsFn = createServerFn({ method: 'POST' })
  .middleware([authFnMiddleware])
  .inputValidator(
    z.object({
      urls: z.array(z.string().url()),
    }),
  )
  .handler(async function* ({ data, context }) { // * en lugar de devolver un valor emite valores múltiples (uno por cada url procesada)
    const total = data.urls.length                  // total es el número total de urls a procesar 
    for (let i = 0; i < data.urls.length; i++) {    // bucle for para recorrer todas las urls
      const url = data.urls[i]                      // url es la url actual

      const item = await prisma.savedItem.create({  // creamos un item en la base de datos
        data: {
          url: url,
          userId: context.session.user.id,
          status: 'PENDING',
        },
      })

      let status: BulkScrapeProgress['status'] = 'success' // status es el estado de la url actual

      try {
        const result = await firecrawl.scrape(url, {       // scrapeamos la url actual
          formats: [
            'markdown',
            {
              type: 'json',
              //schema: extractSchema,
              prompt:
                'please extract the author and also publishedAt timestamp',
            },
          ],
          location: { country: 'US', languages: ['en'] },
          onlyMainContent: true,
          proxy: 'auto',
        })

        const jsonData = result.json as z.infer<typeof extractSchema>

        let publishedAt = null

        if (jsonData.publishedAt) {
          const parsed = new Date(jsonData.publishedAt)

          if (!isNaN(parsed.getTime())) {
            publishedAt = parsed
          }
        }

        await prisma.savedItem.update({  // actualizamos el item en la base de datos con la información scrapeada
          where: {
            id: item.id,
          },
          data: {
            title: result.metadata?.title || null,
            content: result.markdown || null,
            ogImage: result.metadata?.ogImage || null,
            author: jsonData.author || null,
            publishedAt: publishedAt,
            status: 'COMPLETED',
          },
        })
      } catch {
        status = 'failed'
        await prisma.savedItem.update({
          where: {
            id: item.id,
          },
          data: {
            status: 'FAILED',
          },
        })
      }

      const progress: BulkScrapeProgress = {  // progress es el progreso de la url actual
        completed: i + 1,
        total: total,
        url: url,
        status: status,
      }

      yield progress // Se emite un evento AL FINAL de cada vuelta del bucle que será recogido por el cliente
    }
  });

export const getItemsFn = createServerFn({ method: 'GET' })
  .middleware([authFnMiddleware])
  .handler(async ({ context }) => {
    //await new Promise((resolve) => setTimeout(resolve, 1000))

    const items = await prisma.savedItem.findMany({
      where: {
        userId: context.session.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return items
  });

export const getItemById = createServerFn({ method: 'GET' })
  .middleware([authFnMiddleware])
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ context, data }) => {
    const item = await prisma.savedItem.findUnique({  // Busca un item en la base de datos
      where: {
        userId: context.session.user.id,
        id: data.id,
      },
    })

    if (!item) {
      throw notFound()
    }

    return item
  });

export const saveSummaryAndGenerateTagsFn = createServerFn({
  method: 'POST',
})
  .middleware([authFnMiddleware])
  .inputValidator(
    z.object({
      id: z.string(),
      summary: z.string(),
    }),
  )
  .handler(async ({ context, data }) => {
    const existing = await prisma.savedItem.findUnique({  // Busca un item en la base de datos
      where: {
        id: data.id,
        userId: context.session.user.id,
      },
    })

    if (!existing) {
      throw notFound()
    }

    const { text } = await generateText({                     // Genera los tags en base al resumen proporcionado
      model: openrouter.chat('xiaomi/mimo-v2-flash:free'),
      system: `You are a helpful assistant that extracts relevant tags from content summaries.
        Extract 3-5 short, relevant tags that categorize the content.
        Return ONLY a comma-separated list of tags, nothing else.
        Example: technology, programming, web development, javascript`,
      prompt: `Extract tags from this summary: \n\n${data.summary}`,
    })

    const tags = text                                         // Procesa los tags para mostrarlos de forma separada
      .split(',')
      .map((tag) => tag.trim().toLowerCase())
      .filter((tag) => tag.length > 0)
      .slice(0, 5)

    const item = await prisma.savedItem.update({              // Actualiza el item en la base de datos con el resumen y los tags generados
      where: {
        userId: context.session.user.id,
        id: data.id,
      },
      data: {
        summary: data.summary,
        tags: tags,
      },
    })

    return item
  })


