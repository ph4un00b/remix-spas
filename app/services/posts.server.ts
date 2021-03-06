import type { Post } from '@prisma/client'
import { db } from '~/utils.server'
export type { Post } from '@prisma/client'

export function posts (start: number, end: number, limit: number) {
  return db.post.findMany({
    skip: start,
    take: limit,
    orderBy: [{ updateddAt: 'desc' }],
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
