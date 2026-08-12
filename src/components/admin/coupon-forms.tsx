'use client'

import { useState } from 'react'
import { LoaderCircle, Power, Trash2, X } from 'lucide-react'
import {
  deleteCouponAction,
  saveCouponAction,
  toggleCouponAction,
} from '@/app/actions/admin/operacao'
import type { AdminState } from '@/app/actions/admin/catalogo'
import { FieldError, FormError } from '@/components/ui/feedback'
import { useFormAction } from '@/components/ui/use-form-action'
import { Badge } from '@/components/ui/badge'
import { centsToInput, formatBRL } from '@/lib/money'
import { COUPON_TYPE_LABEL, type CouponType } from '@/lib/enums'
import { formatDate } from '@/lib/utils'

export type CouponData = {
  id: string
  code: string
  description: string | null
  type: string
  value: number
  minSubtotal: number
  maxUses: number | null
  usedCount: number
  expiresAt: Date | null
  active: boolean
}

function describeValue(coupon: CouponData) {
  if (coupon.type === 'PERCENT') return `${coupon.value}%`
  if (coupon.type === 'FIXED') return formatBRL(coupon.value)
  return 'Frete grátis'
}

export function CouponManager({ coupons }: { coupons: CouponData[] }) {
  const [editing, setEditing] = useState<CouponData | 'novo' | null>(null)

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-start">
      <ul className="card divide-y divide-brand-100">
        {coupons.map((coupon) => {
          const expired = coupon.expiresAt ? coupon.expiresAt < new Date() : false
          const exhausted = coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses

          return (
            <li key={coupon.id} className="flex flex-wrap items-center gap-4 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-mono text-sm font-bold text-brand-950">{coupon.code}</h3>
                  <Badge tone={coupon.active && !expired && !exhausted ? 'success' : 'neutral'}>
                    {describeValue(coupon)}
                  </Badge>
                  {!coupon.active && <Badge tone="danger">Desligado</Badge>}
                  {expired && <Badge tone="amber">Expirado</Badge>}
                  {exhausted && <Badge tone="amber">Esgotado</Badge>}
                </div>

                <p className="mt-1 text-sm text-ink-muted">
                  {coupon.description ?? COUPON_TYPE_LABEL[coupon.type as CouponType]}
                </p>

                <p className="tag mt-1 text-ink-muted">
                  {coupon.minSubtotal > 0 && `mínimo ${formatBRL(coupon.minSubtotal)} · `}
                  {coupon.usedCount} {coupon.maxUses ? `de ${coupon.maxUses}` : ''} usos
                  {coupon.expiresAt && ` · até ${formatDate(coupon.expiresAt)}`}
                </p>
              </div>

              <div className="flex shrink-0 gap-1">
                <form action={toggleCouponAction.bind(null, coupon.id)}>
                  <button
                    type="submit"
                    className="btn btn-ghost btn-sm px-2"
                    aria-label={coupon.active ? `Desligar ${coupon.code}` : `Ligar ${coupon.code}`}
                    title={coupon.active ? 'Desligar cupom' : 'Ligar cupom'}
                  >
                    <Power size={15} />
                  </button>
                </form>
                <button
                  type="button"
                  onClick={() => setEditing(coupon)}
                  className="btn btn-ghost btn-sm"
                >
                  Editar
                </button>
                <form action={deleteCouponAction.bind(null, coupon.id)}>
                  <button
                    type="submit"
                    className="btn btn-ghost btn-sm px-2 text-ink-muted hover:text-danger"
                    aria-label={`Excluir ${coupon.code}`}
                  >
                    <Trash2 size={15} />
                  </button>
                </form>
              </div>
            </li>
          )
        })}

        {coupons.length === 0 && (
          <li className="px-6 py-12 text-center text-sm text-ink-muted">
            Nenhum cupom criado ainda.
          </li>
        )}
      </ul>

      <div className="lg:sticky lg:top-8">
        {editing ? (
          <CouponForm coupon={editing === 'novo' ? null : editing} onDone={() => setEditing(null)} />
        ) : (
          <button type="button" onClick={() => setEditing('novo')} className="btn btn-primary">
            Novo cupom
          </button>
        )}
      </div>
    </div>
  )
}

function CouponForm({ coupon, onDone }: { coupon: CouponData | null; onDone: () => void }) {
  const [state, action, pending] = useFormAction(saveCouponAction, {} as AdminState, onDone)
  const [type, setType] = useState<string>(coupon?.type ?? 'PERCENT')

  return (
    <form action={action} className="card flex flex-col gap-4 p-5">
      {coupon && <input type="hidden" name="id" value={coupon.id} />}

      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-bold text-brand-950">
          {coupon ? 'Editar cupom' : 'Novo cupom'}
        </h2>
        <button type="button" onClick={onDone} className="btn btn-ghost btn-sm px-2" aria-label="Fechar">
          <X size={16} />
        </button>
      </div>

      <FormError>{state.errors?.form}</FormError>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="code">
            Código
          </label>
          <input
            id="code"
            name="code"
            className="field font-mono uppercase"
            defaultValue={coupon?.code}
            required
            placeholder="CALOURO25"
          />
          <FieldError>{state.errors?.code}</FieldError>
        </div>

        <div>
          <label className="field-label" htmlFor="type">
            Tipo
          </label>
          <select
            id="type"
            name="type"
            className="field"
            value={type}
            onChange={(event) => setType(event.target.value)}
          >
            <option value="PERCENT">Percentual</option>
            <option value="FIXED">Valor fixo</option>
            <option value="FREE_SHIPPING">Frete grátis</option>
          </select>
        </div>

        {type !== 'FREE_SHIPPING' && (
          <div>
            <label className="field-label" htmlFor="value">
              {type === 'PERCENT' ? 'Percentual de desconto' : 'Valor do desconto'}
            </label>
            <input
              id="value"
              name="value"
              className="field font-mono"
              defaultValue={
                coupon
                  ? coupon.type === 'PERCENT'
                    ? String(coupon.value)
                    : centsToInput(coupon.value)
                  : ''
              }
              placeholder={type === 'PERCENT' ? '10' : '25,00'}
              required
            />
            <FieldError>{state.errors?.value}</FieldError>
          </div>
        )}

        <div>
          <label className="field-label" htmlFor="minSubtotal">
            Compra mínima
          </label>
          <input
            id="minSubtotal"
            name="minSubtotal"
            className="field font-mono"
            defaultValue={coupon ? centsToInput(coupon.minSubtotal) : '0,00'}
            placeholder="150,00"
          />
        </div>

        <div>
          <label className="field-label" htmlFor="maxUses">
            Limite de usos <span className="font-normal text-ink-muted">(opcional)</span>
          </label>
          <input
            id="maxUses"
            name="maxUses"
            type="number"
            min={1}
            className="field font-mono"
            defaultValue={coupon?.maxUses ?? ''}
            placeholder="sem limite"
          />
        </div>

        <div>
          <label className="field-label" htmlFor="expiresAt">
            Válido até <span className="font-normal text-ink-muted">(opcional)</span>
          </label>
          <input
            id="expiresAt"
            name="expiresAt"
            type="date"
            className="field"
            defaultValue={coupon?.expiresAt ? coupon.expiresAt.toISOString().slice(0, 10) : ''}
          />
        </div>

        <div className="sm:col-span-2">
          <label className="field-label" htmlFor="description">
            Descrição mostrada ao cliente
          </label>
          <input
            id="description"
            name="description"
            className="field"
            defaultValue={coupon?.description ?? ''}
            placeholder="R$ 25 de desconto em compras acima de R$ 200"
          />
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-2.5 text-sm">
        <input
          type="checkbox"
          name="active"
          defaultChecked={coupon?.active ?? true}
          className="h-4 w-4 accent-brand-700"
        />
        <span className="font-medium text-brand-900">Cupom ativo</span>
      </label>

      <div className="flex gap-2">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending && <LoaderCircle size={16} className="animate-spin" aria-hidden />}
          Salvar cupom
        </button>
        <button type="button" onClick={onDone} className="btn btn-ghost">
          Cancelar
        </button>
      </div>
    </form>
  )
}
