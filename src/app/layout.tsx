import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'KindredCare AI — Elderly Care & Medication Ecosystem',
  description:
    'Smart, interconnected elderly healthcare & medication management ecosystem with passcode-secured Care Circles, proactive email reminders, and Google Gemini + Gemma 4 AI clinical intelligence.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-black text-[#f5f5f5] font-sans antialiased selection:bg-[#5227FF] selection:text-white">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-xl focus:bg-[#5227FF] focus:px-5 focus:py-3 focus:text-base focus:font-bold focus:text-white focus:shadow-xl"
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
