import type { Metadata } from 'next'
import Link from 'next/link'
import {
  BadgeDollarSign,
  Boxes,
  Eye,
  ArrowRightLeft,
  TrendingUp,
  Users,
  ChevronRight,
} from 'lucide-react'
import { AdminHeader } from '@/components/admin/ui'

export const metadata: Metadata = { title: 'Relatórios' }

const REPORTS = [
  {
    href: '/admin/relatorios/financeiro',
    icon: BadgeDollarSign,
    title: 'Financeiro',
    description: 'Faturamento aprovado, ticket médio, meios de pagamento e cupons usados.',
  },
  {
    href: '/admin/relatorios/vendas',
    icon: TrendingUp,
    title: 'Mais e menos vendidos',
    description: 'Ranking de produtos por unidades vendidas no período, do topo à cauda.',
  },
  {
    href: '/admin/relatorios/estoque',
    icon: Boxes,
    title: 'Estoque',
    description: 'Capital parado em estoque por categoria e itens sem saída no período.',
  },
  {
    href: '/admin/relatorios/movimentacao',
    icon: ArrowRightLeft,
    title: 'Movimentação',
    description: 'Entradas e saídas de estoque por motivo, com o histórico do período.',
  },
  {
    href: '/admin/relatorios/visitas',
    icon: Eye,
    title: 'Visitas e conversão',
    description: 'Produtos mais e menos visitados, visitantes únicos e taxa de conversão.',
  },
  {
    href: '/admin/relatorios/usuarios',
    icon: Users,
    title: 'Usuários',
    description: 'Novos cadastros, clientes que mais compraram e quem nunca comprou.',
  },
] as const

export default function AdminRelatoriosPage() {
  return (
    <>
      <AdminHeader
        title="Relatórios"
        description="Uma visão por assunto — cada relatório tem seu próprio filtro de período."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {REPORTS.map((report) => (
          <Link
            key={report.href}
            href={report.href}
            className="card group flex flex-col gap-3 p-5 transition-colors hover:border-brand-600"
          >
            <div className="flex items-center justify-between">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-50 text-brand-700">
                <report.icon size={19} aria-hidden />
              </span>
              <ChevronRight
                size={18}
                className="text-ink-muted transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-brand-950">{report.title}</h2>
              <p className="mt-1 text-sm text-ink-muted">{report.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </>
  )
}
