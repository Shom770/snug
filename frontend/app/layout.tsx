import './globals.css';

import type { Metadata } from 'next';
import type { ReactNode } from 'react';

const DESCRIPTION = 'know how today will feel before you step outside';

// icon.svg, apple-icon.png and opengraph-image.jpg in this folder are picked up by Next; metadataBase makes the
// preview image an absolute URL, which iMessage and other link previews need
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://snugsky.com'),
  title: 'snug',
  description: DESCRIPTION,
  applicationName: 'snug',
  appleWebApp: { title: 'snug', statusBarStyle: 'default' },
  openGraph: { type: 'website', url: '/', siteName: 'snug', title: 'snug', description: DESCRIPTION },
  twitter: { card: 'summary_large_image', title: 'snug', description: DESCRIPTION },
};


export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@500&family=Rethink+Sans:wght@500;600;700;800&family=Patrick+Hand&family=Pixelify+Sans:wght@600;700&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
