import './globals.css';

export const metadata = {
  title: 'Moto Charm BD ERP',
  description: 'Pathao Order Management System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn">
      <body>{children}</body>
    </html>
  );
}