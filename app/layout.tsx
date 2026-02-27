import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from "@/contexts/AuthContext"

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
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster position="top-center" reverseOrder={false} />
      </body>
    </html>
  );
}