'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

/**
 * Revela o conteúdo quando ele entra na tela.
 *
 * O estado vive num atributo do DOM em vez de num `useState`: o observador
 * dispara durante a rolagem e re-renderizar a árvore a cada elemento que
 * aparece custa caro sem nenhum ganho — o CSS já sabe o que fazer com o
 * atributo.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  as: Tag = 'div',
}: {
  children: React.ReactNode
  /** Atraso em milissegundos, para revelar uma lista em cascata. */
  delay?: number
  className?: string
  as?: 'div' | 'section' | 'li' | 'article'
}) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      element.dataset.shown = 'true'
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        element.dataset.shown = 'true'
        observer.disconnect()
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.08 },
    )

    observer.observe(element)

    // Rede de segurança: se o observador não disparar por qualquer motivo, o
    // conteúdo aparece assim mesmo. Conteúdo invisível é pior que conteúdo
    // sem animação.
    const fallback = window.setTimeout(() => {
      element.dataset.shown = 'true'
      observer.disconnect()
    }, 2500)

    return () => {
      window.clearTimeout(fallback)
      observer.disconnect()
    }
  }, [])

  return (
    <Tag
      ref={ref as never}
      data-reveal=""
      style={{ transitionDelay: `${delay}ms` }}
      className={cn(className)}
    >
      {children}
    </Tag>
  )
}
