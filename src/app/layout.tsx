import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'EasyLoan | Intelligent Credit Decisioning via KNN',
  description:
    'Sleek, real-time machine learning underwriting engine for loan approval evaluation using K-Nearest Neighbors.',
  keywords: [
    'loan approval prediction',
    'KNN classifier',
    'machine learning underwriting',
    'credit scoring',
  ],
  authors: [{ name: 'EasyLoan' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="ambient-dark-bg">
          <div className="ambient-glow-1" />
          <div className="ambient-glow-2" />
          <div className="ambient-glow-3" />
        </div>
        {children}
      </body>
    </html>
  );
}
