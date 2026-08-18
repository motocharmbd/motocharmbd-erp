import "./globals.css";
import SakinCommissionDisplay from "./components/SakinCommissionDisplay";

export const metadata = {
  title: "Moto Charm BD ",
  description: "Business Management System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <SakinCommissionDisplay />
      </body>
    </html>
  );
}