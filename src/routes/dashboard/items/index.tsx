import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getItemsFn } from '@/data/items'
import { ItemStatus } from '@/generated/prisma/enums'
import { copyToClipboard } from '@/lib/clipboard'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Copy } from 'lucide-react'


export const Route = createFileRoute('/dashboard/items/')({
  component: RouteComponent,
  loader: () => getItemsFn()
})

function RouteComponent() {

  const data = Route.useLoaderData()


  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Saved Items</h1>
        <p className="text-muted-foreground">
          Your saved articles and content!
        </p>
      </div>

      {/* Search and Filter controls */}
      <div className='flex gap-4'>
        <Input
          placeholder="Search by title or tags"
          className=""
        />

        <Select>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {Object.values(ItemStatus).map((status) => (
              <SelectItem key={status} value={status}>
                {status.charAt(0) + status.slice(1).toLowerCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {data.map((item) => (
          <Card key={item.id} className="group overflow-hidden transition-all hover:shadow-lg pt-0">
            <Link to="/dashboard" className='block'>
              {item.ogImage && (
                <div className='aspect-video w-full overflow-hidden bg-muted'>
                  <img
                    src={item.ogImage}
                    alt={item.title ?? 'Article Thumbnail'}
                    className='w-full h-full object-cover transition-transform group-hover:scale-105'
                  />
                </div>
              )}

              <CardHeader className="space-y-3 pt-4">
                <div className="flex items-center justify-between gap-2">
                  <Badge
                    variant={
                      item.status === 'COMPLETED' ? 'default' : 'secondary'
                    }
                  >
                    {item.status.toLowerCase()}
                  </Badge>

                  <Button
                    onClick={async (e) => {
                      e.preventDefault()
                      await copyToClipboard(item.url)
                    }}
                    variant="outline"
                    size="icon"
                    className="size-8"
                  >
                    <Copy className="size-4" />
                  </Button>
                </div>

                <CardTitle className="line-clamp-1 text-xl leading-snug group-hover:text-primary transition-colors">
                  {item.title}
                </CardTitle>

                {item.author && (
                  <p className="text-xs text-muted-foreground">{item.author}</p>
                )}

                {item.summary && (
                  <CardDescription className="line-clamp-3 text-sm">
                    {item.summary}
                  </CardDescription>
                )}

                {/* Tags */}
                {item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {item.tags.slice(0, 4).map((tag, index) => (
                      <Badge variant="secondary" key={index}>
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardHeader>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  )
}
