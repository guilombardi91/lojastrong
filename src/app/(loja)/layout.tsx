import { SiteHeader } from '@/components/loja/site-header'
import { SiteFooter } from '@/components/loja/site-footer'

export default function LojaLayout({ children }: LayoutProps<'/'>) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  )
}
