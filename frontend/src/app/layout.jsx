import LayoutBody from "@/components/LayoutBody";
import "./globals.css";

export const metadata = {
  title: "Inventory Management System",
  description: "A clean, modern SaaS-inspired dashboard for managing products, customers, and orders.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <LayoutBody>{children}</LayoutBody>
      </body>
    </html>
  );
}
