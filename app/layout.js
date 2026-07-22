import { Rubik, Heebo } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { SiteHeader } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';

const rubik = Rubik({
  subsets: ['latin', 'hebrew'],
  weight: ['500', '700', '800'],
  variable: '--font-rubik'
});

const heebo = Heebo({
  subsets: ['latin', 'hebrew'],
  weight: ['400', '500', '600'],
  variable: '--font-heebo'
});

export const metadata = {
  title: 'קייטרינג בקליק · Catering in a Click',
  description:
    'A catering search and directory platform across Israel - kosher, dairy, meat, every event, one click away.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="he" dir="rtl">
      <body className={`${rubik.variable} ${heebo.variable} font-body min-h-screen flex flex-col`}>
        <Providers>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
