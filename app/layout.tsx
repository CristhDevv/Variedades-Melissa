import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ChatWidget from '@/components/ChatWidget'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'Variedades Melissa | Moda Femenina',
  description: 'Tienda de moda femenina con las mejores prendas. Vestidos, blusas, conjuntos y más. Envíos a todo Colombia.',
  keywords: 'moda femenina, ropa mujer, vestidos, blusas, Colombia',
  openGraph: {
    title: 'Variedades Melissa | Moda Femenina',
    description: 'Las mejores prendas femeninas con envío a todo Colombia',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={inter.variable}>
        {children}
        <ChatWidget />
      </body>
    </html>
  )
}

