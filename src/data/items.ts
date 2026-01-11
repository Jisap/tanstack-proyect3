import { firecrawl } from "@/lib/firecrawl";
import { importSchema } from "@/schemas/import";
import { createServerFn } from "@tanstack/react-start";




export const scrapeUrlFn = createServerFn({ method: 'POST' })
  .inputValidator(importSchema)
  .handler(async ({ data }) => {
    const result = await firecrawl.scrape(
      data.url,
      {
        formats: ["markdown"],
        onlyMainContent: true
      }
    )

    console.log(result)
  })