import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'EMS CEU Library',
  description: 'Find Tennessee EMS continuing education quickly—ACLS, PALS, NRP, PHTLS and more.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
<body className="min-h-screen antialiased bg-white text-slate-900">
<header className="sticky top-0 z-50 bg-white/70 backdrop-blur border-b">
          <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
            <a href="/" className="font-semibold text-brand-700">EMS CEU Library</a>
            <nav className="flex items-center gap-4">
              <a href="/events" className="hover:text-brand-700">Browse</a>
              <a href="/saved" className="hover:text-brand-700">Saved</a>
              <a href="/submit" className="hover:text-brand-700">Submit</a>
              <a href="/profile" className="hover:text-brand-700">Profile</a>
              <a href="/login" className="hover:text-brand-700">Sign in</a>
              <a href="/onboarding" className="rounded-md bg-brand-600 px-3 py-1.5 text-white hover:bg-brand-700">Create Profile</a>
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="border-t mt-16">
          <div className="mx-auto max-w-7xl px-4 py-8 text-sm text-slate-600">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <p>© {new Date().getFullYear()} EMS CEU Library · Tennessee-focused CE resources</p>
              <div className="flex gap-4">
                <a href="#" className="hover:text-slate-900">Privacy</a>
                <a href="#" className="hover:text-slate-900">Terms</a>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}

