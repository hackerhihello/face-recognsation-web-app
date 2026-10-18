import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Face Attendance — Client Admin",
    template: "%s · Face Attendance",
  },
  description: "Face recognition attendance management for client administrators.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-surface-muted text-ink font-sans antialiased">{children}</body>
    </html>
  );
}
