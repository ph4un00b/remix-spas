import type { Post } from '@prisma/client'
import { z } from 'zod'
import { db } from '~/utils.server'
export type { Post } from '@prisma/client'

export function posts () {
  return db.post.findMany({
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
