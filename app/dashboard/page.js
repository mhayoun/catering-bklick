'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '../../components/LanguageProvider';

export default function DashboardPage() {
  const { dict } = useLanguage();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [caterers, setCaterers] = useState(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.email) {
      fetch('/api/my-caterers')
        .then((r) => r.json())
        .then((data) => setCaterers(data.results || []));
    }
  }, [session]);

  async function handleDelete(id) {
    if (!confirm(dict.dashboard.delete + '?')) return;
    await fetch(`/api/caterers/${id}`, { method: 'DELETE' });
    setCaterers((prev) => prev.filter((c) => c.id !== id));
  }

  if (status === 'loading' || caterers === null) {
    return <div className="mx-auto max-w-4xl px-4 py-16 text-center text-eggplant">…</div>;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display font-extrabold text-2xl text-eggplant">{dict.dashboard.title}</h1>
        <Link
          href="/dashboard/new"
          className="bg-paprika text-cream font-display font-bold px-4 py-2 rounded-blob shadow-card hover:shadow-cardHover hover:-translate-y-0.5 transition-transform focus-ring"
        >
          {dict.dashboard.addNew}
        </Link>
      </div>

      {caterers.length === 0 && (
        <p className="bg-turmericLight/60 border-2 border-eggplant/30 rounded-blob p-6 text-center text-ink/70">
          {dict.dashboard.empty}
        </p>
      )}

      <div className="space-y-3">
        {caterers.map((c) => (
          <div key={c.id} className="bg-white border-4 border-eggplant rounded-blob p-4 flex items-center justify-between gap-3">
            <div>
              <p className="font-display font-bold text-eggplant">{c.businessName}</p>
              <p className="text-sm text-ink/60">{c.city}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Link href={`/caterer/${c.id}`} className="text-sm text-zaatar font-semibold hover:underline focus-ring rounded">
                {dict.card.viewProfile}
              </Link>
              <Link href={`/dashboard/${c.id}/edit`} className="text-sm text-paprika font-semibold hover:underline focus-ring rounded">
                {dict.dashboard.edit}
              </Link>
              <button onClick={() => handleDelete(c.id)} className="text-sm text-paprikaDark font-semibold hover:underline focus-ring rounded">
                {dict.dashboard.delete}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
