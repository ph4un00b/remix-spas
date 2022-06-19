import React from 'react'
import { useQuery, useQueryClient } from 'react-query'
import { tw } from 'twind'
import { queryURL } from '../utils.client'

export default function Search () {
  const queryClient = useQueryClient()

  const [query, setQuery] = React.useState<string>('')
  const { data, error, isError, isLoading, isSuccess, refetch, isFetching } = useQuery(
    ['pokemon', query],
    async () => await fetchPokemon(query),
    {
      initialData: () => {
        return queryClient.getQueryData('pokemonos')?.results
          .find(pokemon => pokemon.name === query)
          // todo: handle no image better
      },
      enabled: false,
      refetchOnWindowFocus: true,
      staleTime: Infinity,
      // cacheTime: Infinity,
      retry: 1
      // retryDelay: () => {}
    }
  )

  React.useEffect(() => {
    queryClient.prefetchQuery('pokemonos', fetchPokemonos)
  }, [])

  React.useEffect(() => {
    if (query === '') return
    refetch()
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
      
      {isFetching && <Info> Updating...  </Info>}

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
            {isError && (

              <label className='label'>
                <span className='label-text-alt'>
                  There was an error pleasse try again.
                </span>

                <span className='label-text-alt'>
                  {JSON.stringify(error, undefined, 2)}
                </span>
              </label>

            )}

            {isLoading && (

              <label className='label'>
                <span className='label-text-alt'>
                  Loading...
                </span>
              </label>

            )}

            {isSuccess && (<>
              <span>{data.name}</span>

              <img width={80} src={data.sprites?.front_default ?? ''} alt='pokemon' />

            </>
            )}

          </div>

        </div>

      </form>

      <Pokemonos />
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
  return await queryURL('pokemon')
}

async function fetchPokemon (query: string) {
  return await queryURL(`pokemon/${encodeURIComponent(query)}`)
}

function Pokemonos () {
  const queryClient = useQueryClient()
  // todo validate with zod
  const { data, error, isError, isLoading, isSuccess, refetch, isFetching } = useQuery(
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

  return (
    <div className='overflow-x-auto'>

      {isLoading && (<span>Loading monos...</span>)}

      <table className='table table-compact w-full'>
        <thead>
          <tr>
            <th />
            <th>Name</th>
            <th>URL</th>
          </tr>
        </thead>
        <tbody>

          {isSuccess && data.results.map((pokemon: {name: string, url: string}, id: number) => {
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
