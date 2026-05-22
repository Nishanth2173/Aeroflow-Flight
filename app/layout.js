import './globals.css';
import { Toaster } from 'react-hot-toast';
import Navbar from '@/components/layout/Navbar';
import AuthProvider from '@/components/layout/AuthProvider';

export const metadata = {
  title: 'AeroFlow — Flight Management',
  description: 'Book, manage, and reschedule your flights seamlessly',
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-512.png',
  },
};

export const viewport = {
  themeColor: '#060d1a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        {/* PWA meta tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="AeroFlow" />
      </head>
      <body suppressHydrationWarning>
        <AuthProvider>
          <div className="min-h-screen flex flex-col relative">
            <div id="starfield" className="starfield" aria-hidden="true" />
            <div className="fixed pointer-events-none z-0" style={{
              top: '-20%', left: '-10%', width: '600px', height: '600px',
              background: 'radial-gradient(circle, rgba(29,111,166,0.12) 0%, transparent 70%)',
              borderRadius: '50%',
            }} />
            <div className="fixed pointer-events-none z-0" style={{
              bottom: '-20%', right: '-10%', width: '500px', height: '500px',
              background: 'radial-gradient(circle, rgba(46,196,138,0.06) 0%, transparent 70%)',
              borderRadius: '50%',
            }} />
            <Navbar />
            <main className="flex-1 relative z-10">{children}</main>
          </div>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#0f2040', color: '#e8f4fd',
                border: '1px solid rgba(56,163,212,0.3)',
                borderRadius: '10px', fontFamily: 'DM Sans, sans-serif',
              },
              success: { iconTheme: { primary: '#2ec48a', secondary: '#0f2040' } },
              error: { iconTheme: { primary: '#e8533a', secondary: '#0f2040' } },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}