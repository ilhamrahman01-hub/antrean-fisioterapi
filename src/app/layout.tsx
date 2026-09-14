import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });

export const metadata: Metadata = {
  title: 'Antrean Fisioterapi - Puskesmas Pracimantoro 1',
  description: 'Sistem pendaftaran dan pemantauan antrean Fisioterapi Puskesmas Pracimantoro 1.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${inter.variable} ${playfair.variable} font-sans bg-white text-zinc-900 selection:bg-emerald-900 selection:text-white`}>
        {children}
      </body>
    </html>
  );
}
