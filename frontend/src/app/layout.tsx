export const metadata = {
  title: 'CBE Inventory System',
  description: 'Hardware Inventory Management System for CBE',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
