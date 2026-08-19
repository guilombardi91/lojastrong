import { readConsent } from '@/lib/consent'
import { SiteHeader } from '@/components/loja/site-header'
import { SiteFooter } from '@/components/loja/site-footer'
import { CookieBanner } from '@/components/loja/cookie-banner'

export default async function LojaLayout({ children }: LayoutProps<'/'>) {
  // Quem decide exibir a faixa é o servidor: sem escolha registrada, ela
  // aparece; com escolha, o componente nem chega ao navegador.
  const consent = await readConsent()

  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      {consent === null && <CookieBanner />}
    </>
  )
}
