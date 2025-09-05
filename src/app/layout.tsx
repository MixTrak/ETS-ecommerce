import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import Chatbot from '@/components/Chatbot';
import "./globals.css";

// 👇 Import cursor components
import { CursorProvider, Cursor } from "@/components/cursor";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ETS E-Commerce - Your Premium Shopping Destination",
  description: "Discover premium Electronics products. Shop with confidence at ETS E-Commerce.",
  keywords: "e-commerce, electronics, premium products, online shopping",
  authors: [{ name: "Yao Kouakou Jonson" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-base-100`}
      >
        <AuthProvider>
          <CursorProvider>
            {/* Optional spotlight reveal */}
            {/* <RevealOnCursor src="/images/product-ui.jpg" radius={200} hardness={0.4} opacity={0.9} /> */}
            <Cursor />
            {/* <CursorTrail /> */}
            {children}
          </CursorProvider>

          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
          <Chatbot />
        </AuthProvider>
      </body>
    </html>
  );
}
