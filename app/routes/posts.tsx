import { json, redirect } from '@remix-run/node'
import { useActionData, useLoaderData } from '@remix-run/react'
import { z } from 'zod'
import { createPost, Post, posts } from '~/services/posts.server'

interface LoaderData {
  posts: Post[]
}

export async function loader () {
  const data = { posts: await posts() }
  return json<LoaderData>(data)
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

export async function action ({ request }: {request: Request}) {
  const form = await request.formData()
  const entries = Object.fromEntries(form)

  console.log('entries', entries)

  // todo: test for unexpected field or createdAt
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

  const post = await createPost(res.data)

  console.log('post', post)
  return redirect('posts')
}

export default function Posts () {
  const { posts } = useLoaderData<LoaderData>()
  const action = useActionData<ActionDataErrors>()

  return (
    <>
      <h1>posts!</h1>

      <PostForm
        action='' onSubmitEvent={() => { }}
        btnText='create post'
        errors={action?.errors}
        fields={action?.fields}
      />

      <ul>
        {posts.map((post) => (
          <li key={post.id}>
            <div>
              <h2>{post.title}</h2>
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
  onSubmitEvent: (data: Pick<Post, 'title' | 'body'>) => void,
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
          body: body.value
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
              <span className='label-text-alt'>
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
