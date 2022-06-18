import React from 'react'
import { tw } from 'twind'
import { queryURL } from '../utils.client'

export default function Search () {
  const [query, setQuery] = React.useState<string>('')
  const [data, setData] = React.useState({})
  const [error, setError] = React.useState<string | null>(null)
  const [status, setStatus] = React.useState<'error'|'idle'|'loading'|'success'>('idle')

  const isLoading = status === 'loading'
  const isSuccess = status === 'success'
  const isError = status === 'error'

  React.useEffect(() => {
    if (query === '') return

    setStatus('loading')

    queryURL(`pokemon/${encodeURIComponent(query)}`)
      .then(pokedata => {
        setStatus('success')
        setData(pokedata)
        console.log(pokedata)
      }, (reason: Error) => {
        setError(reason.message)
        setStatus('error')
      })
  }, [query])

  interface Elements { elements: { search: {value: string} } }

  function handleSearchSubmit (e: React.SyntheticEvent) {
    e.preventDefault()
    const target = e.target as typeof e.target & Elements
    setQuery(target.elements.search.value)
  }

  console.log(query)

  return (
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
                {error}
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
  )
}
