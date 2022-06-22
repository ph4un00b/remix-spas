
import { db } from '~/utils.server'
export type { User } from '@prisma/client'

export function posts () {
  return db.post.findMany({
    include: {
      author: {
        select: { email: true, id: true }
      }
    }
  })
}

export function createUser (data: {username: string, password: string}) {
  return db.user.create({
    data: { email: data.username, hashPassword: data.password },
    select: {
      id: true,
      email: true,
      name: true,
      role: true
    }
  })
}
