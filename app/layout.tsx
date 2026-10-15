
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MediSlot | Appointment Management",
  description:
    "A modern appointment management workspace for healthcare teams.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
