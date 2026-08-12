import type { Metadata } from 'next'
import Link from 'next/link'
import { formatBRL } from '@/lib/money'
import { formatDate } from '@/lib/utils'
import { resolvePeriod } from '@/lib/reports'
import { getUsuariosData } from '@/lib/report-data/usuarios'
import { AdminHeader, DataTable, Stat, Td, Th } from '@/components/admin/ui'
import { PeriodFilter } from '@/components/admin/period-filter'
import { ExportButtons } from '@/components/admin/export-buttons'

export const metadata: Metadata = { title: 'Relatório de usuários' }

export default async function RelatorioUsuariosPage({
  searchParams,
}: PageProps<'/admin/relatorios/usuarios'>) {
  const params = await searchParams
  const { value: periodo, since } = resolvePeriod(params.periodo)
  const { totalCustomers, activeCustomers, newCustomers, neverOrdered, spendByCustomer, userById } =
    await getUsuariosData(since)

  return (
    <>
      <AdminHeader
        title="Relatório de usuários"
        description="Cadastro, atividade de compra e quem mais gastou no período."
        action={
          <div className="flex flex-wrap items-center gap-3">
            <PeriodFilter basePath="/admin/relatorios/usuarios" value={periodo} />
            <ExportButtons report="usuarios" periodo={periodo} />
          </div>
        }
      />

      <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Clientes cadastrados" value={String(totalCustomers)} hint={`${activeCustomers} ativos`} />
        <Stat
          label="Novos cadastros"
          value={String(newCustomers.length)}
          hint="No período selecionado"
          tone="success"
        />
        <Stat
          label="Nunca compraram"
          value={String(neverOrdered)}
          hint="Cadastrados sem nenhum pedido"
          tone={neverOrdered > 0 ? 'amber' : 'default'}
          href="/admin/clientes"
        />
        <Stat
          label="Clientes que compraram"
          value={String(spendByCustomer.length)}
          hint="Com pedido aprovado no período"
        />
      </section>

      <div className="grid gap-8 xl:grid-cols-[1.2fr_1fr]">
        <section>
          <h2 className="mb-4 font-display text-lg font-bold text-brand-950">
            Quem mais comprou no período
          </h2>
          <DataTable
            empty="Nenhum pedido aprovado no período."
            head={
              <>
                <Th>Cliente</Th>
                <Th className="text-right">Pedidos</Th>
                <Th className="text-right">Total gasto</Th>
              </>
            }
          >
            {spendByCustomer.map((row) => {
              const user = userById.get(row.userId)
              return (
                <tr key={row.userId}>
                  <Td>
                    {user?.email ? (
                      <Link
                        href={`/admin/clientes?q=${encodeURIComponent(user.email)}`}
                        className="hover:underline"
                      >
                        {user.name}
                      </Link>
                    ) : (
                      'Cliente removido'
                    )}
                    {user?.email && <span className="mt-0.5 block text-xs text-ink-muted">{user.email}</span>}
                  </Td>
                  <Td className="text-right font-mono text-xs">{row._count._all}</Td>
                  <Td className="text-right font-display font-bold">{formatBRL(row._sum.total ?? 0)}</Td>
                </tr>
              )
            })}
          </DataTable>
        </section>

        <section>
          <h2 className="mb-4 font-display text-lg font-bold text-brand-950">Novos cadastros</h2>
          <DataTable
            empty="Nenhum cadastro novo no período."
            head={
              <>
                <Th>Cliente</Th>
                <Th className="text-right">Desde</Th>
              </>
            }
          >
            {newCustomers.map((user) => (
              <tr key={user.id}>
                <Td>
                  {user.name}
                  <span className="mt-0.5 block text-xs text-ink-muted">{user.email}</span>
                </Td>
                <Td className="text-right text-xs text-ink-muted">{formatDate(user.createdAt)}</Td>
              </tr>
            ))}
          </DataTable>
        </section>
      </div>
    </>
  )
}
