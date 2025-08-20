import './globals.css'
import type { Metadata } from 'next'
import { AuthProvider } from '../lib/auth-context'
import { Navigation } from '../components/Navigation'

export const metadata: Metadata = {
  title: 'EMS CEU Library',
  description: 'Find Tennessee EMS continuing education quickly—ACLS, PALS, NRP, PHTLS and more.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased bg-white text-slate-900">
        <AuthProvider>
          <Navigation />
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
        </AuthProvider>
      </body>
    </html>
  )
}

