import React from 'react'
import { useQuery } from 'react-query'
import { tw } from 'twind'
import { queryURL } from '../utils.client'

export default function Search () {
  const { data, error, isError, isLoading, isSuccess, refetch, isFetching } = useQuery(
    'pokemon',
    async () => { return await queryURL(`pokemon/${encodeURIComponent(query)}`) },
    { enabled: false, refetchOnWindowFocus: false }
  )
  const [query, setQuery] = React.useState<string>('')

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

            {isSuccess && (
              <pre>{JSON.stringify(data, undefined, 2)}</pre>
            )}

          </div>

        </div>

      </form>
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
