import React from 'react'
import { useQuery, useQueryClient } from 'react-query'
import { tw } from 'twind'
import { Pokemonos, queryURL, SinglePokemon } from '../utils.client'

function useQueryPokemon (queryKey: string, queryFn: () => Promise<unknown>) {
  const [data, setData] = React.useState<unknown>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [status, setStatus] = React.useState<'error'|'idle'|'loading'|'success'>('idle')

  const isLoading = status === 'loading'
  const isSuccess = status === 'success'
  const isError = status === 'error'

  React.useEffect(() => {
    if (queryKey === '') return

    setStatus('loading')

    void (async function () {
      try {
        await new Promise(resolve => setTimeout(resolve, 2000))
        const result = await queryFn()
        setData(result)
        setStatus('success')
      } catch (error) {
        setStatus('error')
        if (error instanceof Error) {
          setError(error.message)
        } else {
          setError('Something weng wrong!')
        }
      }
    })()
    
  }, [queryKey])

  return { isError, isLoading, isSuccess, data, error }
}

function usePokemon (query: string) {
  const queryClient = useQueryClient()

  return useQuery(
    ['pokemon', query],
    async () => await fetchPokemon(query),
    {
      initialData: () => {
        const pokemonos = queryClient.getQueryData('pokemonos') as Pokemonos
        const pokemon = pokemonos?.results
          .find((pokemon) => pokemon.name === query) as Pick<SinglePokemon, 'name'>
        return pokemon
      },
      enabled: false,
      refetchOnWindowFocus: true,
      staleTime: Infinity,
      // cacheTime: Infinity,
      retry: 1
      // retryDelay: () => {}
    }
  )
}

export default function Search () {
  const queryClient = useQueryClient()

  const [query, setQuery] = React.useState<string>('')
  const pokemonQuery = usePokemon(query)

  React.useEffect(() => {
    void queryClient.prefetchQuery('pokemonos', fetchPokemonos)
  }, [])

  React.useEffect(() => {
    if (query === '') return
    void pokemonQuery.refetch()
  }, [query])

  interface Elements { elements: { search: {value: string} } }

  function handleSearchSubmit (e: React.SyntheticEvent) {
    e.preventDefault()
    const target = e.target as typeof e.target & Elements
    setQuery(target.elements.search.value)
  }

  return (
    <>
      <button
        className='btn btn-outline btn-warning'
        onClick={async () => await queryClient.invalidateQueries('pokemonos', {
          refetchActive: false,
          refetchInactive: true //  for future assets!
        })}
      >invalidate pokemonos!
      </button>

      {pokemonQuery.isFetching && <Info> Updating...  </Info>}

      <form onSubmit={handleSearchSubmit}>

        <div className={tw('grid gap-4')}>
          <div className='form-control w-full max-w-xs'>
            <label htmlFor='search' className='label'>
              <span className='label-text'>What is your name?</span>
              <span className='label-text-alt'>Alt label</span>
            </label>
            <input
              id='search' type='text' placeholder='Type here'
              className='input input-bordered w-full max-w-xs'
            />
            {pokemonQuery.isError && (

              <label className='label'>
                <span className='label-text-alt'>
                  There was an error pleasse try again.
                </span>

                <span className='label-text-alt'>
                  {JSON.stringify(pokemonQuery.error, undefined, 2)}
                </span>
              </label>

            )}

            {pokemonQuery.isLoading && (

              <label className='label'>
                <span className='label-text-alt'>
                  Loading...
                </span>
              </label>

            )}

            <pre>{pokemonQuery.isFetched ? 'fetched' : 'no-fetched'}</pre>
            {pokemonQuery.isSuccess && (
              <>
                <span>{pokemonQuery.data.name}</span>
                {pokemonQuery.isFetched && (

                  <img width={80} src={(pokemonQuery.data as SinglePokemon).sprites.front_default ?? ''} alt='pokemon' />

                )}
              </>)}

          </div>

        </div>

      </form>

      <PokemonosTable />
    </>
  )
}

function Info ({ children }: {children: React.ReactNode}) {
  return (

    <div className='alert alert-info shadow-lg'>
      <div>
        <svg xmlns='http://www.w3.org/2000/svg' className='stroke-current flex-shrink-0 h-6 w-6' fill='none' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' /></svg>
        <span>{children}</span>
      </div>
    </div>

  )
}

async function fetchPokemonos () {
  return await queryURL('pokemon') as Pokemonos
}

async function fetchPokemon (query: string): Promise<SinglePokemon> {
  return await queryURL(`pokemon/${encodeURIComponent(query)}`) as SinglePokemon
}

function usePokemonos () {
  return useQuery(
    ['pokemonos'],
    fetchPokemonos,
    {
      // initialData: some-data
      enabled: true,
      refetchOnWindowFocus: true,
      staleTime: Infinity,
      // cacheTime: Infinity,
      retry: 1,
      refetchInterval: 10000,
      refetchIntervalInBackground: false
      // retryDelay: () => {}
    }
  )
}

function PokemonosTable () {
  const queryClient = useQueryClient()
  // todo validate with zod
  const pokemonosQuery = usePokemonos()

  return (
    <div className='overflow-x-auto'>

      {pokemonosQuery.isLoading && (<span>Loading monos...</span>)}

      <table className='table table-compact w-full'>
        <thead>
          <tr>
            <th />
            <th>Name</th>
            <th>URL</th>
          </tr>
        </thead>
        <tbody>

          {pokemonosQuery.isSuccess && pokemonosQuery.data.results.map((pokemon, id) => {
            return (
              <tr key={id}>
                <th>{id}</th>
                <th>
                  <a
                    href='#'
                    onMouseEnter={
                      async () => await queryClient.prefetchQuery(['pokemon', pokemon.name],
                        async () => await fetchPokemon(pokemon.name),
                        { staleTime: Infinity })
                    }
                    className={tw('underline hover:text-green-500')}
                  >
                    {pokemon.name}
                  </a>
                </th>
                <th>{pokemon.url}</th>
              </tr>
            )
          })}

        </tbody>
        <tfoot>
          <tr>
            <th />
            <th>Name</th>
            <th>URL</th>
          </tr>
        </tfoot>
      </table>
    </div>

  )
}
