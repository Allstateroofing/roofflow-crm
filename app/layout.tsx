import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata = {
  title: "All State Roofing",
  description: "Roofing Company CRM",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground antialiased">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "var(--card)",
              color: "var(--card-foreground)",
              border: "1px solid var(--border)",
              fontSize: "0.875rem",
            },
          }}
        />
      </body>
    </html>
  );
}
