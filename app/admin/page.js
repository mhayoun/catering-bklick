'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '../../components/LanguageProvider';
import { Logo } from '../../components/Logo';
import { pickLocalized } from '../../lib/localized';

export default function AdminPage() {
  const { dict, locale } = useLanguage();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [pending, setPending] = useState(null);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.isAdmin) {
      fetch('/api/admin/pending')
        .then((r) => r.json())
        .then((data) => setPending(data.results || []));
    }
  }, [session]);

  if (status === 'loading' || (status === 'authenticated' && session?.user?.isAdmin === undefined)) {
    return <div className="mx-auto max-w-4xl px-4 py-16 text-center text-eggplant">…</div>;
  }

  if (status === 'authenticated' && !session?.user?.isAdmin) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center space-y-4">
        <Logo className="h-16 w-16 mx-auto" />
        <p className="text-eggplant font-display font-semibold">{dict.admin.notAuthorized}</p>
      </div>
    );
  }

  async function review(id, action) {
    let reason = null;
    if (action === 'reject') {
      reason = window.prompt(dict.admin.rejectReasonPrompt) || '';
    }
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/caterers/${id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason })
      });
      if (res.ok) {
        setPending((prev) => prev.filter((c) => c.id !== id));
      }
    } finally {
      setBusyId(null);
    }
  }

  if (pending === null) {
    return <div className="mx-auto max-w-4xl px-4 py-16 text-center text-eggplant">…</div>;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 space-y-6">
      <div>
        <h1 className="font-display font-extrabold text-2xl text-eggplant">{dict.admin.title}</h1>
        <p className="text-ink/70 mt-1">{dict.admin.subtitle}</p>
      </div>

      {pending.length === 0 && (
        <p className="bg-turmericLight/60 border-2 border-eggplant/30 rounded-blob p-6 text-center text-ink/70">
          {dict.admin.empty}
        </p>
      )}

      <div className="space-y-4">
        {pending.map((c) => (
          <div key={c.id} className="bg-white border-4 border-eggplant rounded-blob p-5 space-y-3">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <p className="font-display font-bold text-lg text-eggplant">{c.businessName}</p>
                <p className="text-sm text-ink/60">
                  {pickLocalized(c.city, locale)} · {dict.admin.submittedBy}: {c.ownerEmail}
                </p>
              </div>
              <Link href={`/caterer/${c.id}`} className="text-sm text-zaatar font-semibold hover:underline focus-ring rounded whitespace-nowrap">
                {dict.admin.viewFullProfile}
              </Link>
            </div>

            <div className="text-sm text-ink/80 space-y-1 bg-cream/60 rounded-blob p-3">
              <p><strong>HE:</strong> {pickLocalized(c.description, 'he') || '—'}</p>
              <p><strong>EN:</strong> {pickLocalized(c.description, 'en') || '—'}</p>
              <p><strong>FR:</strong> {pickLocalized(c.description, 'fr') || '—'}</p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => review(c.id, 'approve')}
                disabled={busyId === c.id}
                className="bg-zaatar text-cream font-display font-bold px-5 py-2 rounded-blob shadow-card hover:shadow-cardHover hover:-translate-y-0.5 transition-transform focus-ring disabled:opacity-60"
              >
                {dict.admin.approve}
              </button>
              <button
                onClick={() => review(c.id, 'reject')}
                disabled={busyId === c.id}
                className="bg-paprika text-cream font-display font-bold px-5 py-2 rounded-blob shadow-card hover:shadow-cardHover hover:-translate-y-0.5 transition-transform focus-ring disabled:opacity-60"
              >
                {dict.admin.reject}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
