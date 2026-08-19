import Link from 'next/link'
import { MailCheck } from 'lucide-react'

/**
 * Barreira do checkout para conta sem e-mail confirmado.
 *
 * Não é uma tela de erro: o carrinho continua montado e o caminho de saída
 * está à vista. A confirmação existe porque é por esse e-mail que sai a
 * confirmação da compra e o código de rastreio.
 */
export function EmailNaoConfirmado({ email }: { email: string }) {
  return (
    <div className="container-page py-16 lg:py-24">
      <div className="card mx-auto flex max-w-lg flex-col items-center gap-4 px-6 py-12 text-center">
        <MailCheck size={32} className="text-brand-600" aria-hidden />

        <h1 className="font-display text-2xl font-extrabold text-brand-950">
          Confirme seu e-mail para finalizar
        </h1>

        <p className="max-w-sm text-ink-muted">
          Enviamos um link de confirmação para <strong className="font-semibold">{email}</strong>. É
          por esse endereço que você recebe a confirmação da compra e o código de rastreio.
        </p>

        <p className="text-sm text-ink-muted">
          Seu carrinho está guardado — volte aqui assim que confirmar.
        </p>

        <div className="mt-2 flex flex-wrap justify-center gap-3">
          <Link href="/conta" className="btn btn-primary">
            Reenviar o e-mail
          </Link>
          <Link href="/carrinho" className="btn btn-outline">
            Voltar ao carrinho
          </Link>
        </div>
      </div>
    </div>
  )
}
