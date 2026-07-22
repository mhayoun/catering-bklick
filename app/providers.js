'use client';

import { SessionProvider } from 'next-auth/react';
import { LanguageProvider } from '../components/LanguageProvider';

export function Providers({ children }) {
  return (
    <SessionProvider>
      <LanguageProvider>{children}</LanguageProvider>
    </SessionProvider>
  );
}
