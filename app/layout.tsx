import type { Metadata, Viewport } from 'next';
import { Hanken_Grotesk, Instrument_Serif, Newsreader } from 'next/font/google';
import './globals.css';

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
  title: 'FinePrint',
  description: 'Paste a contract and see which clauses deserve a second read, flagged clause by clause.',
};

export const viewport: Viewport = { themeColor: '#4a1a20' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${reading.variable}`}>
      <body>{children}</body>
    </html>
  );
}
