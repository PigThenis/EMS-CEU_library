export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-3xl font-bold">Create account</h1>
      <p className="mt-2 text-slate-600">This is a placeholder sign-up page. It does not create a real session yet.</p>
      <form className="mt-6 grid gap-4">
        <div>
          <label className="block text-sm">Full name</label>
          <input className="mt-1 w-full border rounded-md px-3 py-2" placeholder="Jane Doe" />
        </div>
        <div>
          <label className="block text-sm">Email</label>
          <input className="mt-1 w-full border rounded-md px-3 py-2" type="email" placeholder="you@example.com" />
        </div>
        <div>
          <label className="block text-sm">Password</label>
          <input className="mt-1 w-full border rounded-md px-3 py-2" type="password" placeholder="••••••••" />
        </div>
        <button className="rounded-md bg-brand-600 px-3 py-2 text-white hover:bg-brand-700">Sign up</button>
      </form>
      <p className="mt-4 text-sm">Already have an account? <a className="text-brand-700" href="/login">Sign in</a></p>
    </div>
  )
}

