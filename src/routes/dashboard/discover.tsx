import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { BulkScrapeProgress, bulkScrapeUrlsFn, searchWebFn } from '@/data/items'
import { searchSchema } from '@/schemas/import'
import { SearchResultWeb } from '@mendable/firecrawl-js'
import { useForm } from '@tanstack/react-form'
import { createFileRoute } from '@tanstack/react-router'
import { Loader2, Search, Sparkles } from 'lucide-react'
import { useState, useTransition } from 'react'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'

export const Route = createFileRoute('/dashboard/discover')({
  component: RouteComponent,
})

function RouteComponent() {

  const [isPending, startTransition] = useTransition()
  const [searchResults, setSearchResults] = useState<Array<SearchResultWeb>>([]);
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set())
  const [bulkIsPending, startBulkTransition] = useTransition()
  const [progress, setProgress] = useState<BulkScrapeProgress | null>(null)


  // Función que selecciona/deselecciona todos los resultados
  function handleSelectAll() {
    if (selectedUrls.size === searchResults.length) {                      // Si el nº de urls seleccionadas = nº de resultados
      setSelectedUrls(new Set())                                           // establecemos el estado de las url seleccionadas a un set vacio
    } else {                                                               // sino
      setSelectedUrls(new Set(searchResults.map((link) => link.url)))      // establecemos el estado con todas las urls que existan
    }
  }

  // Función selecciona/deselecciona una url
  function handleToggleUrl(url: string) {
    const newSelected = new Set(selectedUrls)                               // Set con las urls seleccionadas

    if (newSelected.has(url)) {                                             // Si el set tiene la url la borra
      newSelected.delete(url)
    } else {                                                                // Si el set no la tiene la añade
      newSelected.add(url)
    }

    setSelectedUrls(newSelected)                                            // Actualizamos el estado de las urls seleccionadas
  };

  // Escrapea las urls seleccionadas desde la busqueda y actualiza 
  // y guarda en base de datos la información scrapeada
  function handleBulkImport() {
    startBulkTransition(async () => {
      if (selectedUrls.size === 0) {
        toast.error('Please select at least one URL to import.')
        return
      }

      setProgress({                                                         // Inicializa el progreso del scrapeo
        completed: 0,
        total: selectedUrls.size,
        url: '',
        status: 'success',
      })
      let successCount = 0                                                  // Se definen variables para scrapeos successful
      let failedCount = 0                                                   // o fallidos

      for await (const update of await bulkScrapeUrlsFn({                   // update recoge el valor del progress de cada scrapeo. Aquí tambien se consume el generador de valores emitidos por bulkScrapeUrlsFn 
        data: { urls: Array.from(selectedUrls) },
      })) {
        setProgress(update)                                                 // Actualiza el progress conforme se scrapean las urls

        if (update.status === 'success') {                                  // Si el status = success
          successCount++                                                    // incrementamos el contador de success
        } else {                                                            // sino aumentamos el de failed
          failedCount++
        }
      }

      setProgress(null)                                                     // Cuando termina establece el progress = null

      if (failedCount > 0) {
        toast.success(`Imported ${successCount} Urls (${failedCount} failed)`)
      } else {
        toast.success(`Successfully imported ${successCount} URLs`)
      }
    })
  }


  const form = useForm({
    defaultValues: {
      query: '',
    },
    validators: {
      onSubmit: searchSchema, // Validador para el formulario
    },
    onSubmit: ({ value }) => {
      startTransition(async () => {
        const result = await searchWebFn({ // searchWebFn busca en las web el query de la busqueda utilizando firecrawl
          data: {
            query: value.query,
          },
        })

        setSearchResults(result) // Guardamos los resultados en el estado (url, title, description, category)
      })
    },
  });

  return (
    <div className="flex flex-1 items-center justify-center py-8">
      <div className="w-full max-w-2xl space-y-6 px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Discover</h1>
          <p className="text-muted-foreground pt-2">
            Search the web for articles on any topic.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Sparkles className="size-5 text-primary" />
              Topic Search
            </CardTitle>
            <CardDescription>
              Search the web for content and import what you find interesting.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                form.handleSubmit()
              }}
            >
              <FieldGroup>
                <form.Field
                  name="query"
                  children={(field) => {
                    const isInvalid =                                         // Si el campo ha sido tocado y no es válido
                      field.state.meta.isTouched && !field.state.meta.isValid
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>
                          Search Query
                        </FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={isInvalid}
                          placeholder="e.g., React Server Components tutorial"
                          autoComplete="off"
                        />
                        {isInvalid && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                      </Field>
                    )
                  }}
                />

                <Button disabled={isPending} type="submit">
                  {isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="size-4" />
                      Search Web
                    </>
                  )}
                </Button>
              </FieldGroup>
            </form>

            {/* Discovered URLs list */}
            {searchResults.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                    Found {searchResults.length} URLs
                  </p>

                  <Button onClick={handleSelectAll} variant="outline" size="sm">
                    {selectedUrls.size === searchResults.length
                      ? 'Deselect All'
                      : 'Select All'}
                  </Button>
                </div>

                <div className="max-h-80 space-y-2 overflow-y-auto rounded-md border p-4">
                  {searchResults.map((link) => (
                    <label
                      key={link.url}
                      className="hover:bg-muted/50 flex cursor-pointer items-start gap-3 rounded-md p-2"
                    >
                      <Checkbox
                        checked={selectedUrls.has(link.url)}
                        onCheckedChange={() => handleToggleUrl(link.url)}
                        className="mt-0.5"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {link.title ?? 'Title has not been found'}
                        </p>

                        <p className="text-muted-foreground truncate text-xs">
                          {link.description ?? 'Description has not been found'}
                        </p>
                        <p className="text-muted-foreground truncate text-xs">
                          {link.url}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>

                {progress && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Importing: {progress.completed} / {progress.total}
                      </span>
                      <span className="font-medium">
                        {Math.round(progress.completed / progress.total) * 100}
                      </span>
                    </div>
                    <Progress
                      value={(progress.completed / progress.total) * 100}
                    />
                  </div>
                )}

                <Button
                  disabled={bulkIsPending}
                  onClick={handleBulkImport}
                  className="w-full"
                  type="button"
                >
                  {bulkIsPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      {progress
                        ? `Importing ${progress.completed}/${progress.total}...`
                        : 'Starting...'}
                    </>
                  ) : (
                    `Import ${selectedUrls.size} URLs`
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
