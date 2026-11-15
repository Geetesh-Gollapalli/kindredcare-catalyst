import type { Metadata } from 'next';
import { Atkinson_Hyperlegible, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const atkinson = Atkinson_Hyperlegible({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-atkinson',
  display: 'swap',
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-jakarta',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'KindredCare AI — Elderly Care & Medication Management Platform',
  description:
    'Smart, interconnected elderly healthcare & medication management ecosystem with passcode-secured Care Circles, proactive email reminders, and Google Gemini + Gemma 4 AI clinical intelligence.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${atkinson.variable} ${jakarta.variable}`}>
      <body className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-teal-600 selection:text-white">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-xl focus:bg-teal-800 focus:px-5 focus:py-3 focus:text-base focus:font-bold focus:text-white focus:shadow-xl"
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
