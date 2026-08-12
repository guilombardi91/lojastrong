import Image from 'next/image'
import { cn } from '@/lib/utils'

/**
 * Assinatura oficial da escola.
 *
 * O arquivo enviado pela Strong é a versão branca, para fundo escuro; a
 * variante azul é derivada dela por `scripts/gerar-logo-escuro.mjs`. O símbolo
 * âmbar é o mesmo nas duas.
 */
export function Logo({
  className,
  tone = 'dark',
  width = 148,
}: {
  className?: string
  /** `dark` para fundo claro, `light` para fundo escuro. */
  tone?: 'dark' | 'light'
  width?: number
}) {
  const source = tone === 'dark' ? '/logo-strong.png' : '/logo-strong-white.png'

  return (
    <Image
      src={source}
      alt="Strong Business School"
      width={width}
      height={Math.round((width * 52) / 200)}
      priority
      className={cn('h-auto w-auto select-none', className)}
      style={{ width, height: 'auto' }}
    />
  )
}

/**
 * Só o laço do logotipo, redesenhado em vetor para escalar sem perda.
 * Serve de selo em espaços pequenos — favicon, avatar do painel, marcas d'água.
 */
export function Emblema({ className, size = 36 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      aria-hidden
      className={cn('shrink-0', className)}
    >
      <path
        d="M28 26 L50 44 L72 26 L86 40 L64 58 L86 76 L72 90 L50 72 L28 90 L14 76 L36 58 L14 40 Z"
        stroke="currentColor"
        strokeWidth="11"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}
