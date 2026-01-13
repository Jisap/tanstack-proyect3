import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getItemsFn } from '@/data/items'
import { ItemStatus } from '@/generated/prisma/enums'
import { copyToClipboard } from '@/lib/clipboard'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Copy, Inbox } from 'lucide-react'
import z from 'zod'
import { zodValidator } from '@tanstack/zod-adapter'
import { Suspense, use, useEffect, useState } from 'react'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'


// Search and Filter schema
const itemsSearchSchema = z.object({
  q: z.string().default(''),
  status: z.union([z.literal('all'), z.nativeEnum(ItemStatus)]).default('all'),
});

type ItemsSearch = z.infer<typeof itemsSearchSchema>


export const Route = createFileRoute('/dashboard/items/')({
  component: RouteComponent,
  loader: () => ({ itemsPromise: getItemsFn() }),    // getItemsFn devuelve Promise<Item[]> 
  validateSearch: zodValidator(itemsSearchSchema),   // Añade validación al search y valores por defecto incrustrando en la url los searchParams
});

function ItemList({
  q,
  status,
  data,
}: {
  q: ItemsSearch['q']
  status: ItemsSearch['status']
  data: ReturnType<typeof getItemsFn> // Devuelve Promise<Item[]> 
}) {

  const items = use(data); // Con use leemos la promise y obtenemos Item[]

  //Filtrado de items
  const filteredItems = items.filter((item) => {
    // Filtramos los items según el searchParam q 
    const matchesQuery =                                                    // Si el searchParam q es igual a '' 
      q === '' ||
      item.title?.toLowerCase().includes(q.toLowerCase()) ||                // o el título  
      item.tags.some((tag) => tag.toLowerCase().includes(q.toLowerCase()))  // o alguna de las etiquetas del item contiene el searchParam q

    // Filter by status
    const matchesStatus = status === 'all' || item.status === status

    return matchesQuery && matchesStatus
  })

  if (filteredItems.length === 0) {
    return (
      <Empty className="border rounded-lg h-full">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Inbox className="size-12" />
          </EmptyMedia>
          <EmptyTitle>
            {items.length === 0 ? 'No Items saved yet' : 'No items found'}
          </EmptyTitle>
          <EmptyDescription>
            {items.length === 0
              ? 'Import a URL to get started with saving your content.'
              : 'No items match your current search filters.'}
          </EmptyDescription>
        </EmptyHeader>
        {items.length === 0 && (
          <EmptyContent>
            <Link className={buttonVariants()} to="/dashboard/import">
              Import URL
            </Link>
          </EmptyContent>
        )}
      </Empty>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {filteredItems.map((item) => (
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
  )
}

function ItemsGridSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="overflow-hidden pt-0">
          <Skeleton className="aspect-video w-full" />
          <CardHeader className="space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="size-8 rounded-md" />
            </div>

            {/* Title */}
            <Skeleton className="h-6 w-full" />

            {/* Author  */}
            <Skeleton className="h-4 w-40" />
          </CardHeader>
        </Card>
      ))}
    </div>
  )
}


function RouteComponent() {

  const navigate = useNavigate({ from: Route.fullPath });             // Navigate actualiza la URL de la página. {from: Route.fullPath} Cualquier navegación que se haga con esta función navigate debe considerarse como si se originara desde la ruta /dashboard/items/".
  const { itemsPromise } = Route.useLoaderData();                      // Obtiene los datos del loader
  const { q, status } = Route.useSearch();                            // Obtiene los searchParams de la URL
  const [searchInput, setSearchInput] = useState(q);                  // Estado para controlar el input de búsqueda

  // Cuando el input cambia se actualiza el searchParam 
  // de la URL con el nuevo searchParam
  useEffect(() => {
    if (searchInput === q) return                                     // Si el valor del input es igual al searchParam no hace nada

    const timeoutId = setTimeout(() => {                              // Pero sino lo es ejecutamos un timeout
      navigate({ search: (prev) => ({ ...prev, q: searchInput }) })   // que navega a la URL con el nuevo searchParam
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchInput, navigate, q]);




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
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by title or tags"
          className=""
        />

        <Select
          value={status}
          onValueChange={(value) =>
            navigate({
              search: (prev) => ({
                ...prev,
                status: value as typeof status,
              }),
            })
          }
        >
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

      <Suspense fallback={<ItemsGridSkeleton />}>
        <ItemList
          q={q} status={status}
          data={itemsPromise}
        />
      </Suspense>
    </div>
  )
}
