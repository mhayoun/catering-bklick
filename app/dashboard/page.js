'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '../../components/LanguageProvider';
import { pickLocalized } from '../../lib/localized';

export default function DashboardPage() {
  const { dict, locale } = useLanguage();
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
    return <div className="mx-auto max-w-4xl px-4 py-16 text-center text-teal">…</div>;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display font-extrabold text-2xl text-teal">{dict.dashboard.title}</h1>
        <Link
          href="/dashboard/new"
          className="bg-orange text-cream font-display font-bold px-4 py-2 rounded-blob shadow-card hover:shadow-cardHover hover:-translate-y-0.5 transition-transform focus-ring"
        >
          {dict.dashboard.addNew}
        </Link>
      </div>

      <p className="text-sm text-ink/60 -mt-2">{dict.dashboard.moderationNote}</p>

      {caterers.length === 0 && (
        <p className="bg-limeLight/60 border-2 border-teal/30 rounded-blob p-6 text-center text-ink/70">
          {dict.dashboard.empty}
        </p>
      )}

      <div className="space-y-3">
        {caterers.map((c) => (
          <div key={c.id} className="bg-white border-4 border-teal rounded-blob p-4 flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-display font-bold text-teal">{c.businessName}</p>
                <StatusBadge status={c.status} dict={dict} />
              </div>
              <p className="text-sm text-ink/60">{pickLocalized(c.city, locale)}</p>
              {c.status === 'rejected' && c.rejectionReason && (
                <p className="text-sm text-orangeDark mt-1">
                  <strong>{dict.dashboard.rejectionReason}:</strong> {c.rejectionReason}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Link href={`/caterer/${c.id}`} className="text-sm text-tealGreen font-semibold hover:underline focus-ring rounded">
                {dict.card.viewProfile}
              </Link>
              <Link href={`/dashboard/${c.id}/edit`} className="text-sm text-orange font-semibold hover:underline focus-ring rounded">
                {dict.dashboard.edit}
              </Link>
              <button onClick={() => handleDelete(c.id)} className="text-sm text-orangeDark font-semibold hover:underline focus-ring rounded">
                {dict.dashboard.delete}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status, dict }) {
  const map = {
    pending_review: { label: dict.dashboard.statusPending, cls: 'bg-limeLight text-teal' },
    approved: { label: dict.dashboard.statusApproved, cls: 'bg-tealGreen text-cream' },
    rejected: { label: dict.dashboard.statusRejected, cls: 'bg-orange text-cream' }
  };
  const conf = map[status] || map.pending_review;
  return (
    <span className={`text-xs font-display font-bold px-2 py-1 rounded-full ${conf.cls}`}>{conf.label}</span>
  );
}
