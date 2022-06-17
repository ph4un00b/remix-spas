import React, { ReactNode } from 'react'
import { tw } from 'twind'

export default function Index () {
  const [openModal, setOpenModal] = React.useState<'none' | 'login' | 'register'>('none')
  const dialogRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (dialogRef.current === null) return
    dialogRef.current.checked = openModal !== 'none'
  }, [openModal])

  function login (formData) {
    console.log('login', formData)
  }

  function signup (formData) {
    console.log('signup', formData)
  }
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

      <Dialog ref={dialogRef}>
        <h3 className={tw('text-lg font-bold uppercase')}>
          {openModal}
        </h3>

        {openModal === 'login' && (<PostForm onSubmit={login} btnText='login' />)}
        {openModal === 'register' && (<PostForm onSubmit={signup} btnText='signup' />)}

      </Dialog>
    </>
  )
}

const logo = (
  <svg xmlns='http://www.w3.org/2000/svg' width={80} height={80} viewBox='0 0 20 20' fill='currentColor'>
    <path d='M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z' />
  </svg>
)

type DialogOpts =
  & { children: ReactNode }
  & React.HTMLAttributes<HTMLInputElement>

const Dialog = React.forwardRef<HTMLInputElement, DialogOpts>(({ children }, ref) => {
  return (

    <div>
      {/* The button to open modal */}
      {/* <label htmlFor='my-modal-3' className={tw('btn modal-button')}>open modal</label> */}
      {/* Put this part before </body> tag */}
      <input ref={ref} type='checkbox' id='my-modal-3' className={tw('modal-toggle')} defaultChecked={false} />

      <div className={tw('modal')}>
        <div className={tw('modal-box relative')}>
          <label htmlFor='my-modal-3' className={tw('btn btn-sm btn-circle absolute right-2 top-2')}>
            ✕
          </label>

          {children}
        </div>
      </div>
    </div>

  )
})

interface Elements { elements: { username: {value: string}, password: {value: string} } }
interface PostFormOpts {onSubmit: Function, btnText: string}

function PostForm ({ onSubmit, btnText }: PostFormOpts) {
  return (

    <form onSubmit={(e) => {
      e.preventDefault()
      const target = e.target as typeof e.target & Elements
      const { username, password } = target.elements

      onSubmit({
        username: username.value,
        password: password.value
      })
    }}
    >

      <div className={tw('grid gap-4')}>
        <div className='form-control w-full max-w-xs'>
          <label htmlFor='username' className='label'>
            <span className='label-text'>What is your name?</span>
            <span className='label-text-alt'>Alt label</span>
          </label>
          <input
            id='username' type='text' placeholder='Type here'
            className='input input-bordered w-full max-w-xs'
          />
        </div>
        <div className='form-control w-full max-w-xs'>
          <label htmlFor='password' className='label'>
            <span className='label-text'>What is your name?</span>
            <span className='label-text-alt'>Alt label</span>
          </label>
          <input
            id='password' type='password' placeholder='Type here'
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
