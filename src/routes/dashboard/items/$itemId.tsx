import { MessageResponse } from '@/components/ai-elements/message'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { getItemById } from '@/data/items'
import { cn } from '@/lib/utils'
import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { ArrowLeft, Badge, Calendar, ChevronDown, Clock, ExternalLink, User } from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/dashboard/items/$itemId')({
  component: RouteComponent,
  loader: ({ params }) => getItemById({ data: { id: params.itemId } }),
  head: ({ loaderData }) => {
    const title = loaderData?.title ?? 'Item Details'
    const image = loaderData?.ogImage ?? "ogImage"
    return {
      meta: [
        { title },
        { property: 'og:image', content: image },
        { name: 'twitter:title', content: title }
      ]
    }
  }
})

function RouteComponent() {

  const data = Route.useLoaderData();
  const [contentOpen, setContentOpen] = useState(false)
  const router = useRouter();

  return (
    <div className="mx-auto max-w-3xl space-y-6 w-full">
      <div className="flex justify-start">
        <Link
          to="/dashboard/items"
          className={buttonVariants({
            variant: 'outline',
          })}
        >
          <ArrowLeft />
          Go Back
        </Link>
      </div>

      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
        <img
          className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
          src={
            data.ogImage ??
            'https://images.unsplash.com/photo-1635776062043-223faf322554?q=80&w=1632&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
          }
          alt={data.title ?? 'Item Image'}
        />
      </div>

      <div className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">
          {data.title ?? 'Untitled'}
        </h1>

        {/* Metadata Row */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          {data.author && (
            <span className="inline-flex items-center gap-1">
              <User className="size-3.5" />
              {data.author}
            </span>
          )}

          {data.publishedAt && (
            <span className="inline-flex items-center gap-1">
              <Calendar className="size-3.5" />
              {new Date(data.publishedAt).toLocaleDateString('en-US')}
            </span>
          )}

          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" />
            Saved {new Date(data.createdAt).toLocaleDateString('en-US')}
          </span>
        </div>

        <a
          href={data.url}
          className="text-primary hover:underline inline-flex items-center gap-1 text-sm"
          target="_blank"
        >
          View Original
          <ExternalLink className="size-3.5" />
        </a>

        {/* Tags */}
        {data.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {data.tags.map((tag) => (
              <Badge>{tag}</Badge>
            ))}
          </div>
        )}

        {/* Summary */}
        {/* TODO: implement */}

        {/* Content Section */}
        {data.content && (
          <Collapsible
            open={contentOpen}
            onOpenChange={setContentOpen}
          >
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <span className="font-medium">Full Content</span>
                <ChevronDown
                  className={cn(
                    contentOpen ? 'rotate-180' : '',
                    'size-4 transition-transform duration-200',
                  )}
                />
              </Button>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <Card className="mt-2">
                <CardContent>
                  <MessageResponse>{data.content}</MessageResponse>
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    </div>
  )
}
