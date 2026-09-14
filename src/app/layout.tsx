import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Antrean Fisioterapi - Puskesmas Pracimantoro 1",
  description: "Sistem Pengambilan Antrean & Cek Kuota Poli Fisioterapi Puskesmas Pracimantoro 1",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        <meta name="theme-color" content="#00685f" />
      </head>
      <body className="min-h-screen bg-slate-50 antialiased flex flex-col">
        {children}
      </body>
    </html>
  );
}
