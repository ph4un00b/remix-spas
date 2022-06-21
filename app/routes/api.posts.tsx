import { json, LoaderFunction } from '@remix-run/node'
import { z } from 'zod'
import { createPost, posts } from '~/services/posts.server'

interface LoaderData {
  posts: Awaited<ReturnType<typeof posts>>
}

export const loader: LoaderFunction = async ({ request, params }) => {
  const url = new URL(request.url)
  const limit = Number(url.searchParams.get('limit') ?? 4)
  const page = Number(url.searchParams.get('page') ?? 1)

  const start = (page - 1) * limit
  const end = page * limit

  const data = { posts: await posts(start, end, limit) }
  return json<LoaderData>(data)
}

export async function action ({ request }: {request: Request}) {
  const entries = await request.json()

  // const form = await request.formData()
  // const entries = Object.fromEntries(form)

  console.log('entries', entries)

  const postValidator = z.object({
    title: z.string(),
    body: z.string().min(1),
    authorId: z.string().uuid()
  })

  const res = postValidator.safeParse(entries)

  if (!res.success) {
    const { fieldErrors } = res.error.flatten()
    return json({
      errors: { ...fieldErrors },
      fields: entries
    }, { status: 400 })
  }

  // todo: add author from session
  const post = await createPost(res.data)
  return post
}
