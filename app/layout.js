import './globals.css';

export const metadata = {
  title: 'TenantHub',
  description: 'Simple tenant management for landlords',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
