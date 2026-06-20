import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Compass — Your child\'s journey, navigated',
  description:
    'Compass is a personal navigator for parents of autistic and special needs children. It knows your child, knows your journey, and tells you what to do next.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
