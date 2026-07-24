'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { CatererForm } from '../../../components/CatererForm';

export default function NewCatererPage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  if (status !== 'authenticated') {
    return <div className="mx-auto max-w-4xl px-4 py-16 text-center text-teal">…</div>;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <CatererForm />
    </div>
  );
}
