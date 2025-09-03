'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to onboarding for registration
    router.replace('/onboarding');
  }, [router]);
  
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <p className="text-center text-slate-600">Redirecting to registration...</p>
    </div>
  );
}
