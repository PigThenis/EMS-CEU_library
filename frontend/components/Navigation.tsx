'use client';

import { useAuth } from '../lib/auth-context';
import Link from 'next/link';

export function Navigation() {
  const { user, loading, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/70 backdrop-blur border-b">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-semibold text-brand-700">
          EMS CEU Library
        </Link>
        <nav className="flex items-center gap-4">
          <Link href="/events" className="hover:text-brand-700">
            Browse
          </Link>
          {user && (
            <>
              <Link href="/saved" className="hover:text-brand-700">
                Saved
              </Link>
              <Link href="/submit" className="hover:text-brand-700">
                Submit
              </Link>
              <Link href="/profile" className="hover:text-brand-700">
                Profile
              </Link>
            </>
          )}
          
          {loading ? (
            <div className="animate-pulse bg-gray-200 h-6 w-16 rounded"></div>
          ) : user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600">
                {user.displayName || user.email}
              </span>
              <button
                onClick={handleSignOut}
                className="text-sm hover:text-brand-700"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link href="/login" className="hover:text-brand-700">
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-brand-600 px-3 py-1.5 text-white hover:bg-brand-700"
              >
                Sign up
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}