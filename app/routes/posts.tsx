import { json, redirect } from '@remix-run/node'
import { useActionData, useLoaderData } from '@remix-run/react'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { z } from 'zod'
import { createPost, Post, posts } from '~/services/posts.server'

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

export default function Posts () {
  const queryClient = useQueryClient()
  const initialData = useLoaderData<LoaderData>()
  const action = useActionData<ActionDataErrors>()

  const posts = useQuery('posts', async () => {
    await new Promise(resolve => setTimeout(resolve, 2000))
    const resp = await fetch('/api/posts', { method: 'get', headers: { 'Content-Type': 'application/json' } })
    if (!resp.ok) throw new Error('Something went wrong!')
    return await resp.json()
  }, { initialData, enabled: true })

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
    const resp = await fetch('/api/post', {
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!resp.ok) throw new Error('Something went wrong!')
  }, {
    // onSuccess: () => { void queryClient.invalidateQueries('posts') },
    onError: (e) => { console.log(e) },
    onSettled: () => { void queryClient.invalidateQueries('posts') }
  }
  )

  console.log('suc', posts.isSuccess)

  return (
    <>
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

      <ul>
        {posts.isSuccess && posts.data?.posts?.map((post) => (
          <li key={post.id}>
            <pre>{JSON.stringify(post, undefined, 2)}</pre>
            <div>
              <h2>{post.title}</h2>
              <h3>{post.author.email}</h3>
              <p>{post.body}</p>
            </div>
          </li>
        ))}
      </ul>

    </>
  )
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

export async function loader () {
  const data = { posts: await posts() }
  return json<LoaderData>(data)
}

export async function action ({ request }: {request: Request}) {
  const form = await request.formData()
  const entries = Object.fromEntries(form)

  console.log('entries', entries)

  const postValidator = z.object({
    title: z.string(),
    body: z.string().min(1)
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
  const post = await createPost(res.data)

  console.log('post', post)
  return redirect('posts')
}
