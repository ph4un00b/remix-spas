import { ActionFunction, json } from '@remix-run/node'
import { z } from 'zod'
import { db } from '~/utils.server'
import jwt from 'jsonwebtoken'

export interface LoginPayload {
  token: string
  role: string
  email: string
  id: string
}

export const action: ActionFunction = async ({ request }) => {
  // todo: try this validation on the root action
  const env = z.object({ JWT_SECRET: z.string() })
    .parse(process.env)

  const data = await request.json()

  const loginValidator = z.object({
    username: z.string().email(),
    password: z.string().min(4)
  })

  const res = loginValidator.safeParse(data)

  if (!res.success) {
    const { fieldErrors } = res.error.flatten()
    return json({
      errors: { ...fieldErrors },
      fields: data
    }, { status: 400 })
  }

  const user = await db.user.findFirst({
    where: {
      email: { equals: res.data.username },
      hashPassword: { equals: res.data.password }
    },
    select: { id: true, email: true, role: true }
  })

  if (user == null) {
    return json({
      error: 'Invalid user or password!'
    }, { status: 401 })
  }

  const token = jwt.sign(user, env.JWT_SECRET)
  const payload = { ...user, token }

  return json<LoginPayload>(payload)
}
