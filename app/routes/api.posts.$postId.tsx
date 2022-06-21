import { ActionFunction, json, LoaderFunction } from '@remix-run/node'
import { z } from 'zod'
import { db } from '~/utils.server'

export const loader: LoaderFunction = async ({ params }) => {
  const post = z.object({ postId: z.string().uuid() }).parse(params)

  const data = {
    post: await db.post.findFirst({
      where: { id: { equals: post.postId } },
      include: {
        author: {
          select: { email: true, id: true }
        }
      }
    })
  }
  return json(data)
}

export const action: ActionFunction = async ({ request }) => {
  const entries = await request.json()

  const postValidator = z.object({
    title: z.string().min(1),
    // body: z.string().min(1),
    id: z.string().uuid()
  })

  const res = postValidator.safeParse(entries)

  if (!res.success) {
    const { fieldErrors } = res.error.flatten()
    return json({
      errors: { ...fieldErrors },
      fields: entries
    }, { status: 400 })
  }

  const post = await db.post.update({
    where: { id: res.data.id },
    data: { title: res.data.title }
  })

  return post
}
