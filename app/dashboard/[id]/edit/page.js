'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { CatererForm } from '../../../../components/CatererForm';

export default function EditCatererPage({ params }) {
  const { status } = useSession();
  const router = useRouter();
  const [initial, setInitial] = useState(undefined);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    fetch(`/api/caterers/${params.id}`)
      .then((r) => r.json())
      .then((data) => setInitial(data.caterer || null));
  }, [params.id]);

  if (status !== 'authenticated' || initial === undefined) {
    return <div className="mx-auto max-w-4xl px-4 py-16 text-center text-teal">…</div>;
  }
  if (initial === null) {
    return <div className="mx-auto max-w-4xl px-4 py-16 text-center text-teal">404</div>;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <CatererForm initial={initial} catererId={params.id} />
    </div>
  );
}
