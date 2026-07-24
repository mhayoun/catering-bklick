import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { isAdminEmail } from './admin';

const hasGoogleCreds = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

const providers = [];

if (hasGoogleCreds) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    })
  );
}

// DEV-ONLY FALLBACK: lets you test sign-in / the dashboard / the
// registration form locally before Google OAuth credentials exist.
// It never checks a password and must never be reachable in production -
// it's gated on both "no Google creds configured" AND NODE_ENV !== 'production'.
if (!hasGoogleCreds && process.env.NODE_ENV !== 'production') {
  providers.push(
    CredentialsProvider({
      id: 'dev-demo',
      name: 'Demo Owner (dev only)',
      credentials: {
        email: { label: 'Email', type: 'email' }
      },
      async authorize(credentials) {
        const email = credentials?.email || 'demo@example.com';
        return { id: email, email, name: 'Demo Owner' };
      }
    })
  );
}

export const authOptions = {
  providers,
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login'
  },
  callbacks: {
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.sub;
        session.user.isAdmin = isAdminEmail(session.user.email);
      }
      return session;
    }
  }
};
