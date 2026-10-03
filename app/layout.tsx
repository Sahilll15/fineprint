import type { Metadata, Viewport } from 'next';
import { Hanken_Grotesk, Instrument_Serif, Newsreader } from 'next/font/google';
import './globals.css';
import { JSON_LD, jsonLdScript, SITE_DESCRIPTION, SITE_KEYWORDS, SITE_NAME, SITE_TITLE, SITE_URL } from './site';

const display = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-instrument',
});

const sans = Hanken_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-hanken',
});

const reading = Newsreader({
  subsets: ['latin'],
  weight: ['400', '500'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-newsreader',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_TITLE, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  applicationName: SITE_NAME,
  authors: [{ name: 'Sahil Chalke', url: 'https://sahilchalke.com' }],
  creator: 'Sahil Chalke',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: '/',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@chalke1015',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = { themeColor: '#4a1a20' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${reading.variable}`}>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(JSON_LD) }} />
        {children}
      </body>
    </html>
  );
}
