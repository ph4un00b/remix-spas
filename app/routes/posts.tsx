import React from 'react'
import { json, LoaderFunction, redirect } from '@remix-run/node'
import { useActionData, useLoaderData } from '@remix-run/react'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { z } from 'zod'
import { createPost, Post, posts } from '~/services/posts.server'
import { Route, Router, useRoute } from 'wouter'
import { tw } from 'twind'

interface LoaderData {
  posts: Awaited<ReturnType<typeof posts>>
}

interface ActionDataErrors {
  errors?: {
    title?: string[]
    body?: string[]
  }
  fields?: {
    title?: string
    body?: string
  }
}

function Rutas () {
  return (
    <>

      <Route path='/'>
        <Posts />
      </Route>

      <Route path='/edit/:name'>
        <SinglePost />
      </Route>

    </>

  )
}

function SinglePost () {
  const queryClient = useQueryClient()
  const [,{ postId }] = useRoute('/edit/:postId')

  const postQuery = useQuery(['post', String(postId)], async () => {
    await new Promise(resolve => setTimeout(resolve, 2000))
    const resp = await fetch(`/api/posts/${postId}`, { method: 'get', headers: { 'Content-Type': 'application/json' } })
    if (!resp.ok) throw new Error('Something went wrong!')
    return await resp.json()
  })

  const mutation = useMutation(async (values) => {
    await new Promise(resolve => setTimeout(resolve, 2000))
    const resp = await fetch(`/api/posts/${values.id}`, { body: JSON.stringify(values), method: 'post', headers: { 'Content-Type': 'application/json' } })
    if (!resp.ok) throw new Error('Something went wrong!')
    return await resp.json()
  }, {
    onMutate: (currentValues) => {
      // prevent rece conditions
      void queryClient.cancelQueries(['post', currentValues.id])

      const oldData = queryClient.getQueryData(['post', currentValues.id])

      queryClient.setQueryData(['post', currentValues.id], (old) => {
        console.log(old, currentValues)
        return {
          post: {
            ...old.post,
            ...currentValues
          }
        }
      })

      return () => queryClient.setQueryData(['post', currentValues.id], oldData)
    },
    onError: (e, vals, rollbackFn) => {
      if (rollbackFn) rollbackFn()
    },
    onSettled: (dataResponse, e, currentValues) => {
      void queryClient.invalidateQueries(['post', currentValues.id])
    }
  })

  return (
    <>
      {postQuery.isFetching && <pre>is fetching...</pre>}
      {postQuery.isLoading && <pre>is loading...</pre>}
      {postQuery.isError && <pre>something went wrong!</pre>}
      {postQuery.isSuccess && (
        <>
          <div className='card w-96 bg-base-100 shadow-xl image-full'>
            <div className='card-body'>
              <div className='card-actions justify-end'>
                <p>{postQuery.data.post.id}</p>
                <p>{postQuery.data.post.title}</p>
                <p>{postQuery.data.post.body}</p>
                <p>{postQuery.data.post.author.email}</p>
              </div>
            </div>

          </div>

          <form onSubmit={(e) => {
            e.preventDefault()
            const data = Object.fromEntries(new FormData(e.target as HTMLFormElement))
            // console.log(data)
            mutation.mutate(data)
          }}
          >
            <input type='text' name='title' defaultValue={postQuery.data.post.title} />
            <input type='hidden' name='id' defaultValue={postQuery.data.post.id} />
            <br />
            <button type='submit'>{
              mutation.isLoading
                ? 'Saving...'
                : mutation.isError
                  ? 'Error!'
                  : mutation.isSuccess
                    ? 'Saved!'
                    : 'Save Post!'
            }
            </button>
          </form>
        </>

      )}

    </>
  )
}

function Posts () {
  const [page, setPage] = React.useState<number>(1)
  const queryClient = useQueryClient()
  const initialData = useLoaderData<LoaderData>()
  const action = useActionData<ActionDataErrors>()

  const posts = useQuery(['posts', { page }], async () => {
    await new Promise(resolve => setTimeout(resolve, 2000))
    const resp = await fetch(`/api/posts?page=${page}&limit=${10}`, { method: 'get', headers: { 'Content-Type': 'application/json' } })
    if (!resp.ok) throw new Error('Something went wrong!')
    return await resp.json()
  }, { initialData, enabled: true, keepPreviousData: true })

  // async function createPost (data) {
  //   const resp = await fetch('/api/posts', {
  //     method: 'post',
  //     headers: {
  //       'Content-Type': 'application/json'
  //     },
  //     body: JSON.stringify(data)
  //   })
  //   console.log('resp', await resp.json())
  // }

  async function createPost (data: Pick<Post, 'title' | 'body'| 'authorId'>) {
    mutation.mutate(data)
  }

  const mutation = useMutation(async (data) => {
    await new Promise(resolve => setTimeout(resolve, 2000))
    const resp = await fetch('/api/posts', {
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!resp.ok) throw new Error('Something went wrong!')
  }, {
    onMutate: (currentValues) => {
      // prevent race conditions!
      void queryClient.cancelQueries('posts')

      const oldPost = queryClient.getQueryData('posts')

      queryClient.setQueryData('posts', (oldPosts) => {
        console.log(oldPosts, new Date().toISOString())
        // return oldPosts
        return {
          posts: [
            {
              ...currentValues,
              // fake data below
              id: Date.now()
            },
            ...oldPosts.posts
          ]
        }
      })

      return () => queryClient.setQueryData('post', oldPost)
    },
    // onSuccess: () => { void queryClient.invalidateQueries('posts') },
    onError: (e, currentValues, rollbackCallback) => {
      console.log(e)
      if (rollbackCallback) rollbackCallback()
    },
    onSettled: () => {
      void queryClient.invalidateQueries('posts', {
        refetchInactive: true
      })
    }
  }
  )

  return (
    <>
      {((action?.errors) != null) && <pre>{JSON.stringify(action.errors, undefined, 2)}</pre>}
      <h1>posts!</h1>

      {posts.isFetching && <pre>updating post...</pre>}

      {posts.isLoading && <pre>loading posts...</pre>}

      {posts.isError && <pre>Error loading posts...</pre>}

      {/* {posts.isSuccess && <pre>{JSON.stringify(posts, undefined, 2)}</pre>} */}

      <PostForm
        action='' onSubmitEvent={createPost}
        btnText={
          mutation.isLoading
            ? 'Saving Post!'
            : mutation.isError
              ? 'Error on Post!'
              : mutation.isSuccess
                ? 'Post Saved'
                : 'Create post!'
          }
        errors={action?.errors}
        fields={action?.fields}
      />

      {mutation.isError && <pre>{JSON.stringify(mutation.error.message)}</pre>}

      <button
        disabled={page === 1}
        className={tw('btn btn-prymary mr-44')} onClick={(old) => setPage(old => old - 1)}
      >
        Prev
      </button>

      <button
        disabled={posts.isFetching || !posts.data?.next}
        className='btn btn-secondary' onClick={(old) => setPage(old => old + 1)}
      >
        Next
      </button>

      <span>current page: {page} {posts.isFetching ? '...' : ''}</span>

      <ul>
        {posts.isSuccess && posts.data?.posts?.map((post, idx) => (

          <li key={post.id}>

            <div className='card w-96 bg-base-100 shadow-xl image-full'>
              <figure><img src='https://api.lorem.space/image/fashion?w=400&h=225' alt='Shoes' /></figure>
              <div className='card-body'>
                <pre>{JSON.stringify(post, undefined, 2)}</pre>
                <div className='card-actions justify-end'>
                  <button
                    onClick={() => navigate(`#/edit/${post.id}`)}
                    className='btn btn-primary'
                  >Edit Post
                  </button>
                </div>
              </div>
            </div>

          </li>
        ))}
      </ul>

    </>
  )
}

function isBrowser (): boolean {
  return typeof document !== 'undefined'
}

// returns the current hash location in a normalized form
// (excluding the leading '#' symbol)
function currentLocation () {
  return window.location.hash.replace(/^#/, '') || '/'
}

function navigate (to: string) {
  return (window.location.hash = to)
}

function useHashLocation (): [location: string, setLocation: (to: string) => string] {
  const [loc, setLoc] = React.useState(currentLocation())

  React.useEffect(() => {
    // this function is called whenever the hash changes
    const handler = () => setLoc(currentLocation())

    // subscribe to hash changes
    window.addEventListener('hashchange', handler)
    return () => window.removeEventListener('hashchange', handler)
  }, [])

  return [loc, navigate]
}

export default function App () {
  if (isBrowser()) {
    return (
      <>
        <a onClick={() => { navigate('#/') }}>posts home</a>

        <Router hook={useHashLocation}>
          <Rutas />
        </Router>
      </>
    )
  } else {
    return (
      <>
        <a onClick={() => { navigate('#/') }}>posts home</a>
        <Posts />
      </>
    )
  }
}

interface Elements {
  elements: { title: {value: string}, body: {value: string} }
}

type PostFormOpts = {
  onSubmitEvent: (data: Pick<Post, 'title' | 'body'| 'authorId'>) => void
  btnText: string
  action: string
} & ActionDataErrors

function PostForm ({ errors, fields, action, onSubmitEvent, btnText }: PostFormOpts) {
  return (

    <form
      action={action} method='post' onSubmit={(e) => {
        e.preventDefault()
        const target = e.target as typeof e.target & Elements
        const { title, body } = target.elements

        onSubmitEvent({
          title: title.value,
          body: body.value,
          authorId: '983a0d4a-5539-4e57-bfa1-254f06e3a70e'
        })
      }}
    >

      {/* <pre>{JSON.stringify(errors)}</pre> */}

      <div className='grid gap-4'>
        <div className='form-control w-full max-w-xs'>
          <label htmlFor='title' className='label'>
            <span className='label-text'>title</span>
            <span className='label-text-alt'>Alt label</span>
          </label>
          <input
            defaultValue={fields?.title}
            name='title' type='text' placeholder='Type here'
            className='input input-bordered w-full max-w-xs'
          />
          {((errors?.title) != null) && (

            <label htmlFor='title' className='label'>
              <span className='label-text-alt' />
              <span className='label-text-alt text-red-400'>
                {errors.title[0]}
              </span>
            </label>

          )}
        </div>
        <div className='form-control w-full max-w-xs'>
          <label htmlFor='body' className='label'>
            <span className='label-text'>body</span>
            <span className='label-text-alt'>Alt label</span>
          </label>
          <input
            defaultValue={fields?.body}
            name='body' type='body' placeholder='Type here'
            className='input input-bordered w-full max-w-xs'
          />
          {((errors?.body) != null) && (

            <label htmlFor='title' className='label'>
              <span className='label-text-alt' />
              <span className='label-text-alt text-red-400'>
                {errors.body[0]}
              </span>
            </label>

          )}
        </div>

        <div className='grid'>
          <button type='submit' className='btn gap-2'>
            <svg className='animate-spin' xmlns='http://www.w3.org/2000/svg' width={20} height={20} fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' /></svg>
            {btnText}
          </button>

        </div>

      </div>

    </form>

  )
}

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url)
  const limit = Number(url.searchParams.get('limit') ?? 4)
  const page = Number(url.searchParams.get('page') ?? 1)

  const start = (page - 1) * limit
  const end = page * limit

  const data = { posts: await posts(start, end, limit) }
  return json<LoaderData>(data)
}

export async function action ({ request }: {request: Request}) {
  const form = await request.formData()
  const entries = Object.fromEntries(form)

  console.log('entries', entries)

  const postValidator = z.object({
    title: z.string(),
    body: z.string().min(1),
    authorId: z.string().uuid()
  })

  const res = postValidator.safeParse(entries)
  // const res = postValidator.parse(entries)

  if (!res.success) {
    const { fieldErrors } = res.error.flatten()
    return json({
      errors: { ...fieldErrors },
      fields: entries
    }, { status: 400 })
  }

  // todo: add author from session
  // todo: handle application errors not just validation errors
  const post = await createPost(res.data)

  console.log('post', post)
  return redirect('posts')
}
