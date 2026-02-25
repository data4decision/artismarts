import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from 'react-hot-toast';

// No more next/font/google import — we load Roboto via CSS now

export const metadata: Metadata = {
  title: "Artismart",
  description: "Connecting customers with trusted artisans",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-roboto antialiased">
        {children}
        <Toaster position="top-center" reverseOrder={false} />
      </body>
    </html>
  );
}