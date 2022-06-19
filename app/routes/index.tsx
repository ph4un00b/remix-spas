import { json, redirect } from '@remix-run/node'
import { useActionData } from '@remix-run/react'
import React from 'react'
import { tw } from 'twind'
import z from 'zod'
import { createUser } from '~/services/users.server'

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

export default function Index () {
  const [openModal, setOpenModal] = React.useState<'none' | 'login' | 'register'>('none')
  const dialogRef = React.useRef<HTMLInputElement>(null)
  const action = useActionData<ActionDataErrors>()

  React.useEffect(() => {
    if (dialogRef.current === null) return
    if (openModal === 'none') {
      dialogRef.current.checked = false
    } else {
      dialogRef.current.checked = true
    }
  }, [openModal])

  function login (formData: User) {
    console.log('login', formData)
  }

  function signup (formData: User) {
    console.log('signup', formData)
  }

  console.log('modal', openModal)
  return (
    <>
      {((action?.errors) != null) && (<pre>{JSON.stringify(action.errors, undefined, 2)}</pre>)}
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

        {openModal === 'login' && (<PostForm onSubmit={login} btnText='login' />)}
        {openModal === 'register' && (<PostForm onSubmit={signup} btnText='signup' />)}

      </Dialog>}
    </>
  )
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
interface PostFormOpts {onSubmit: (data: User) => void, btnText: string}

function PostForm ({ onSubmit, btnText }: PostFormOpts) {
  return (

    <form method='post' action='?index'>

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
