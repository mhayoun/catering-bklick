'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { CatererForm } from '../../../components/CatererForm';
import { LoadingScreen } from '../../../components/Spinner';

export default function NewCatererPage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  if (status !== 'authenticated') {
    return <LoadingScreen />;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <CatererForm />
    </div>
  );
}
