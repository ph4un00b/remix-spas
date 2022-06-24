import { json, redirect } from '@remix-run/node'
import { useActionData } from '@remix-run/react'
import localforage from 'localforage'
import React from 'react'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { tw } from 'twind'
import z from 'zod'
import { createUser } from '~/services/users.server'
import { LoginPayload } from './api.login'

const userValidator = z.object({
  username: z.string().email(),
  password: z.string().min(4)
})

type User = z.infer<typeof userValidator>

interface ActionDataErrors {
  errors?: {
    username?: string[]
    password?: string[]
  }
  fields?: {
    username?: string
    password?: string
  }
}

export async function action ({ request }: {request: Request}) {
  const form = await request.formData()
  const data = Object.fromEntries(form)

  const res = userValidator.safeParse(data)
  if (!res.success) {
    const { fieldErrors } = res.error.flatten()
    console.log(fieldErrors)
    return json({
      errors: { ...fieldErrors },
      fields: data
    }, { status: 400 })
  }

  await createUser(res.data)
  return redirect('/')
}

async function loginUser (credentials: User): Promise<LoginPayload> {
  const headers = { 'Content-Type': 'application/json' }

  await new Promise(resolve => setTimeout(resolve, 2400))
  try {
    const resp = await fetch('api/login',
      { method: 'post', headers, body: JSON.stringify(credentials) })
    const payload = await resp.json()
    if (resp.ok) { return payload }
    throw new Error('hola!')
  } catch (e) {
    throw new Error('Something went wrong on login!')
  }
}

function isBrowser (): boolean {
  return typeof document !== 'undefined'
}

function UnauthApp ({ login, signup }: {login: (data: User) => void, signup: (data: User) => void}) {
  const [openModal, setOpenModal] = React.useState<'none' | 'login' | 'register'>('none')
  const dialogRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (dialogRef.current === null) return
    if (openModal === 'none') { dialogRef.current.checked = false } else { dialogRef.current.checked = true }
  }, [openModal])

  return (
    <>
      {logo}
      <h1>Hey!</h1>
      <div>
        <button onClick={() => setOpenModal('login')}>login</button>
      </div>
      <div>

        <button onClick={() => setOpenModal('register')}>register</button>
      </div>

      {openModal !== 'none' && <Dialog ref={dialogRef} closeHandler={() => setOpenModal('none')}>
        <h3 className={tw('text-lg font-bold uppercase')}>
          {openModal}
        </h3>

        {openModal === 'login' && (<PostForm onSubmitEvent={login} btnText='login' />)}
        {openModal === 'register' && (<PostForm onSubmitEvent={signup} btnText='signup' />)}

                               </Dialog>}
    </>

  )
}
export default function Index () {
  const queryClient = useQueryClient()
  const [user, setUser] = React.useState<LoginPayload | null>(null)
  const [error, setError] = React.useState<unknown | null>(null)
  const action = useActionData<ActionDataErrors>()

  const loginMutation = useMutation('user', loginUser, {
    onSuccess: (a) => { console.log('success', a) }
  })

  const me = useQuery('user', async () => {
    await new Promise(resolve => setTimeout(resolve, 2400))
    const user = await localforage.getItem('remix-spas-user')
    setUser(user as LoginPayload)
    return user
  })

  async function login (formData: User) {
    loginMutation.mutate(formData, {
      onSuccess: async (a) => {
        console.log('succes-2', a)
        setUser(a)
        await localforage.setItem('remix-spas-user', a)
      },
      onError: (e) => {
        // console.error('catch',  e)
        setError(e)
      }
    })
  }

  function signup (formData: User) {
    console.log('signup', formData)
  }

  async function logout () {
    await localforage.removeItem('remix-spas-user')
    setUser(null)
  }

  if (me.isLoading) return <pre>root loading...</pre>
  if (me.isError) return <pre>error  {(me.error as Error).message}</pre>

  if (user == null) {
    return <UnauthApp login={login} signup={signup} />
  } else {
    return (
      <>
        {((action?.errors) != null) && (<pre>{JSON.stringify(action.errors, undefined, 2)}</pre>)}

        <h1>Hey! {user?.role} {user?.email}</h1>
        <button onClick={logout} className='btn btn-secondary'>Logout</button>
      </>
    )
  }
}

const logo = (
  <svg xmlns='http://www.w3.org/2000/svg' width={80} height={80} viewBox='0 0 20 20' fill='currentColor'>
    <path d='M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z' />
  </svg>
)

type DialogOpts =
  & { children: React.ReactNode, closeHandler: () => void }
  & React.HTMLAttributes<HTMLInputElement>

const Dialog = React.forwardRef<HTMLInputElement, DialogOpts>(({ children, closeHandler }, ref) => {
  return (

    <div>
      {/* The button to open modal */}
      {/* <label htmlFor='my-modal-3' className={tw('btn modal-button')}>open modal</label> */}
      {/* Put this part before </body> tag */}
      <input
        ref={ref} type='checkbox' id='my-modal-3'
        className={tw('modal-toggle')} defaultChecked={false}
      />

      <div className={tw('modal')}>
        <div className={tw('modal-box relative')}>
          <label
            htmlFor='my-modal-3' onClick={closeHandler}
            className={tw('btn btn-sm btn-circle absolute right-2 top-2')}
          >
            ✕
          </label>

          {children}
        </div>
      </div>
    </div>

  )
})

interface Elements { elements: { username: {value: string}, password: {value: string} } }
interface PostFormOpts {onSubmitEvent: (data: User) => void, btnText: string}

function PostForm ({ onSubmitEvent, btnText }: PostFormOpts) {
  return (

    <form
      onSubmit={(e) => {
        e.preventDefault()

        console.log('on-submit!')
        const credentials = Object.fromEntries((new FormData(e.target as HTMLFormElement)))
        onSubmitEvent(credentials as User)
      }}
      method='post' action='?index'
    >

      <div className={tw('grid gap-4')}>
        <div className='form-control w-full max-w-xs'>
          <label htmlFor='username' className='label'>
            <span className='label-text'>What is your name?</span>
            <span className='label-text-alt'>Alt label</span>
          </label>
          <input
            id='username' name='username' type='text' placeholder='Type here'
            className='input input-bordered w-full max-w-xs'
          />
        </div>
        <div className='form-control w-full max-w-xs'>
          <label htmlFor='password' className='label'>
            <span className='label-text'>What is your name?</span>
            <span className='label-text-alt'>Alt label</span>
          </label>
          <input
            id='password' name='password' type='password' placeholder='Type here'
            className='input input-bordered w-full max-w-xs'
          />
        </div>

        <div className={tw('grid')}>
          <button type='submit' className='btn gap-2'>
            <svg className={tw('animate-spin')} xmlns='http://www.w3.org/2000/svg' width={20} height={20} fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' /></svg>
            {btnText}
          </button>

        </div>

      </div>

    </form>

  )
}
