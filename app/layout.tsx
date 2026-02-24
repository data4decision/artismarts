import { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import { Toaster } from 'react-hot-toast';

// Configure Roboto with common weights (it's a static font, not variable)
// Adjust weights as needed for your app. Include italic if you use it.
const roboto = Roboto({
  subsets: ["latin"],
  weight: ["100", "300", "400", "500", "700", "900"], // Covers thin to black
  style: ["normal", "italic"], // Include italic if needed
  display: "swap", // Good for avoiding FOIT (flash of invisible text)
});

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
      
      <body className={`${roboto.className} antialiased`}>
        
        {children}
         <Toaster position="top-center" reverseOrder={false} />
      </body>
    </html>
  );
}