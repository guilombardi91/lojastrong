import type { Metadata } from 'next'
import { Bricolage_Grotesque, Instrument_Sans, JetBrains_Mono } from 'next/font/google'
import './globals.css'

// Display com caráter editorial, corpo humanista e uma mono para os dados que
// a loja precisa mostrar com precisão: SKU, estoque, número de pedido.
const bricolage = Bricolage_Grotesque({
  variable: '--font-bricolage',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
})

const instrument = Instrument_Sans({
  variable: '--font-instrument',
  subsets: ['latin'],
})

const jetbrains = JetBrains_Mono({
  variable: '--font-jetbrains',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
})

export const metadata: Metadata = {
  title: {
    default: 'Loja Strong Business School',
    template: '%s · Loja Strong',
  },
  description:
    'Canecas, camisas, agasalhos, canetas e cadernos da Strong Business School. Feitos para quem estuda, ensina e representa a escola.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="pt-BR"
      className={`${bricolage.variable} ${instrument.variable} ${jetbrains.variable} h-full`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  )
}
