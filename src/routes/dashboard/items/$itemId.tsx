import { buttonVariants } from '@/components/ui/button'
import { getItemById } from '@/data/items'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, Calendar, Clock, User } from 'lucide-react'

export const Route = createFileRoute('/dashboard/items/$itemId')({
  component: RouteComponent,
  loader: ({ params }) => getItemById({ data: { id: params.itemId } }),
  //head: ({ loaderData }) => {
  // const title = loaderData?.title ?? 'Item Details'
  // const description =
  //   loaderData?.summary ??
  //   'View saved article details and AI-generated summary'
  // const image = loaderData?.ogImage

  // return {
  //   title,
  //   description,
  //   image,
  // }
})

function RouteComponent() {

  const data = Route.useLoaderData()

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
      </div>
    </div>
  )
}
