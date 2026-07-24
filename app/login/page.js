'use client';

import { useEffect, useState } from 'react';
import { signIn, getProviders } from 'next-auth/react';
import { useLanguage } from '../../components/LanguageProvider';
import { Logo } from '../../components/Logo';

export default function LoginPage() {
  const { dict } = useLanguage();
  const [providers, setProviders] = useState(null);

  useEffect(() => {
    getProviders().then(setProviders);
  }, []);

  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center space-y-6">
      <Logo className="h-20 w-20 mx-auto" />
      <h1 className="font-display font-extrabold text-2xl text-teal">{dict.auth.loginTitle}</h1>
      <p className="text-ink/70">{dict.auth.loginSubtitle}</p>

      <div className="flex flex-col items-center gap-3">
        {providers?.google && (
          <button
            onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
            className="bg-orange text-cream font-display font-bold px-6 py-3 rounded-blob shadow-card hover:shadow-cardHover hover:-translate-y-0.5 transition-transform focus-ring inline-flex items-center gap-2"
          >
            <GoogleG /> {dict.auth.googleLogin}
          </button>
        )}

        {providers?.['dev-demo'] && (
          <div className="border-2 border-dashed border-teal/40 rounded-blob p-4 text-start w-full">
            <p className="text-xs font-semibold text-teal/70 mb-2">
              ⚠️ Dev-only fallback - no Google OAuth configured yet. Never available in production.
            </p>
            <button
              onClick={() => signIn('dev-demo', { email: 'demo@example.com', callbackUrl: '/dashboard' })}
              className="bg-tealGreen text-cream font-display font-bold px-5 py-2.5 rounded-blob shadow-card hover:shadow-cardHover hover:-translate-y-0.5 transition-transform focus-ring w-full"
            >
              Continue as Demo Owner
            </button>
          </div>
        )}

        {providers && !providers.google && !providers['dev-demo'] && (
          <p className="text-sm text-orangeDark">No sign-in provider is configured.</p>
        )}
      </div>
    </div>
  );
}

function GoogleG() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35 24 35c-6.1 0-11-4.9-11-11s4.9-11 11-11c2.8 0 5.3 1 7.3 2.7l6-6C33.6 6.5 29.1 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5c10.2 0 19-7.4 19-19 0-1.3-.1-2.7-.4-4z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c2.8 0 5.3 1 7.3 2.7l6-6C33.6 6.5 29.1 4.5 24 4.5c-7.8 0-14.5 4.4-17.7 10.2z" />
      <path fill="#4CAF50" d="M24 43.5c5.1 0 9.6-1.9 13-5.1l-6-4.9c-2 1.5-4.6 2.4-7 2.4-5.2 0-9.6-2.6-11.3-6.9l-6.6 5.1c3.2 6 9.9 9.4 17.9 9.4z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.3 4-4.3 5.4l6 4.9c-.4.3 6.9-5 6.9-15.3 0-1.3-.1-2.7-.3-4z" />
    </svg>
  );
}
