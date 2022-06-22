import { RemixBrowser } from '@remix-run/react'
import { hydrate } from 'react-dom'
import {
  QueryClient,
  QueryClientProvider
} from 'react-query'

const queryClient = new QueryClient()

function RemixWithReactQuery () {
  return (
    <QueryClientProvider client={queryClient}>
      <RemixBrowser />
    </QueryClientProvider>
  )
}

hydrate(<RemixWithReactQuery />, document)
