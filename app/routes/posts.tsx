import { json, redirect } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { z } from 'zod'
import { createPost, Post, posts } from '~/services/posts.server'

interface LoaderData {
  posts: Post[]
}

export async function loader () {
  const data = { posts: await posts() }
  return json<LoaderData>(data)
}

export async function action ({ request }: {request: Request}) {
  const form = await request.formData()
  const entries = Object.fromEntries(form)

  console.log('entries', entries)

  // todo: test for unexpected field or createdAt
  const postValidator = z.object({
    title: z.string(),
    body: z.string()
  })

  // todo: handle failed validation
  const post = await createPost(postValidator.parse(entries))

  console.log('post', post)
  return redirect('posts')
}

export default function Posts () {
  const { posts } = useLoaderData<LoaderData>()
  console.log('all-posts', JSON.stringify(posts))

  return (
    <>
      <h1>posts!</h1>

      <PostForm action='' onSubmitEvent={() => {}} btnText='create post' />

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

interface PostFormOpts {
  onSubmitEvent: (data: Pick<Post, 'title' | 'body'>) => void,
  btnText: string
  action: string
}

function PostForm ({ action, onSubmitEvent, btnText }: PostFormOpts) {
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

      <div className='grid gap-4'>
        <div className='form-control w-full max-w-xs'>
          <label htmlFor='title' className='label'>
            <span className='label-text'>title</span>
            <span className='label-text-alt'>Alt label</span>
          </label>
          <input
            name='title' type='text' placeholder='Type here'
            className='input input-bordered w-full max-w-xs'
          />
        </div>
        <div className='form-control w-full max-w-xs'>
          <label htmlFor='body' className='label'>
            <span className='label-text'>body</span>
            <span className='label-text-alt'>Alt label</span>
          </label>
          <input
            name='body' type='body' placeholder='Type here'
            className='input input-bordered w-full max-w-xs'
          />
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
