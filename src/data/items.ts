import { prisma } from "@/db";
import { firecrawl } from "@/lib/firecrawl";
import { bulkImportSchema, extractSchema, importSchema } from "@/schemas/import";
import { createServerFn } from "@tanstack/react-start";
import { authFnMiddleware } from "@/middlewares/auth";
import z from "zod";




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


