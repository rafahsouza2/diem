import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Intranet — Centro Clínico Diem',
  description: 'Plataforma de gestão interna do Centro Clínico Diem',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
