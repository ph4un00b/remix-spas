import type { Post } from '@prisma/client'
import { db } from '~/utils.server'
export type { Post } from '@prisma/client'

export function posts () {
  return db.post.findMany({
    include: {
      author: {
        select: { email: true, id: true }
      }
    }
  })
}

export function createPost (post: Pick<Post, 'title' | 'body' | 'authorId'>) {
  return db.post.create({ data: post })
}
