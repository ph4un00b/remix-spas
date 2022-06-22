import type { MetaFunction } from '@remix-run/node'
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration
} from '@remix-run/react'
import { ReactQueryDevtools } from 'react-query/devtools'
import { tw } from 'twind'

export const meta: MetaFunction = () => ({
  charset: 'utf-8',
  title: 'New Remix App',
  viewport: 'width=device-width,initial-scale=1'
})

export function links () {
  return [
    { rel: 'stylesheet', href: 'https://cdn.jsdelivr.net/npm/daisyui@2.15.3/dist/full.css' }
  ]
}

export default function App () {
  return (
    <html lang='en'>
      <head>
        <Meta />
        <Links />
      </head>
      <body className={tw('px-8 py-10')}>
        <Outlet />
        <ReactQueryDevtools initialIsOpen={false} />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  )
}
