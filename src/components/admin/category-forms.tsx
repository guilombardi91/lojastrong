'use client'

import { useState } from 'react'
import { LoaderCircle, Trash2, X } from 'lucide-react'
import {
  deleteCategoryAction,
  saveCategoryAction,
  type AdminState,
} from '@/app/actions/admin/catalogo'
import { FieldError, FormError } from '@/components/ui/feedback'
import { useFormAction } from '@/components/ui/use-form-action'
import { Badge } from '@/components/ui/badge'

export type CategoryData = {
  id: string
  name: string
  slug: string
  description: string | null
  emblem: string | null
  sortOrder: number
  active: boolean
  productCount: number
}

export function CategoryManager({ categories }: { categories: CategoryData[] }) {
  const [editing, setEditing] = useState<CategoryData | 'nova' | null>(null)

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-start">
      <ul className="card divide-y divide-brand-100">
        {categories.map((category) => (
          <li key={category.id} className="flex items-center gap-4 p-4">
            <span
              aria-hidden
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-lg"
            >
              {category.emblem ?? '•'}
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-display text-base font-bold text-brand-950">{category.name}</h3>
                {!category.active && <Badge tone="danger">Inativa</Badge>}
              </div>
              <p className="truncate text-sm text-ink-muted">
                {category.description ?? 'Sem descrição'}
              </p>
              <p className="tag mt-1 text-brand-600">
                /{category.slug} · {category.productCount}{' '}
                {category.productCount === 1 ? 'produto' : 'produtos'}
              </p>
            </div>

            <div className="flex shrink-0 gap-1">
              <button
                type="button"
                onClick={() => setEditing(category)}
                className="btn btn-ghost btn-sm"
              >
                Editar
              </button>
              <form action={deleteCategoryAction.bind(null, category.id)}>
                <button
                  type="submit"
                  className="btn btn-ghost btn-sm px-2 text-ink-muted hover:text-danger"
                  aria-label={`Excluir ${category.name}`}
                  title={
                    category.productCount > 0
                      ? 'Categoria com produtos: será desativada'
                      : 'Excluir categoria'
                  }
                >
                  <Trash2 size={15} />
                </button>
              </form>
            </div>
          </li>
        ))}

        {categories.length === 0 && (
          <li className="px-6 py-12 text-center text-sm text-ink-muted">
            Nenhuma categoria cadastrada.
          </li>
        )}
      </ul>

      <div className="lg:sticky lg:top-8">
        {editing ? (
          <CategoryForm
            category={editing === 'nova' ? null : editing}
            onDone={() => setEditing(null)}
          />
        ) : (
          <button type="button" onClick={() => setEditing('nova')} className="btn btn-primary">
            Nova categoria
          </button>
        )}
      </div>
    </div>
  )
}

function CategoryForm({
  category,
  onDone,
}: {
  category: CategoryData | null
  onDone: () => void
}) {
  const [state, action, pending] = useFormAction(saveCategoryAction, {} as AdminState, onDone)

  return (
    <form action={action} className="card flex flex-col gap-4 p-5">
      {category && <input type="hidden" name="id" value={category.id} />}

      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-bold text-brand-950">
          {category ? 'Editar categoria' : 'Nova categoria'}
        </h2>
        <button type="button" onClick={onDone} className="btn btn-ghost btn-sm px-2" aria-label="Fechar">
          <X size={16} />
        </button>
      </div>

      <FormError>{state.errors?.form}</FormError>

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="sm:col-span-3">
          <label className="field-label" htmlFor="name">
            Nome
          </label>
          <input
            id="name"
            name="name"
            className="field"
            defaultValue={category?.name}
            required
            placeholder="Canecas e garrafas"
          />
          <FieldError>{state.errors?.name}</FieldError>
        </div>

        <div>
          <label className="field-label" htmlFor="emblem">
            Símbolo
          </label>
          <input
            id="emblem"
            name="emblem"
            className="field text-center"
            defaultValue={category?.emblem ?? ''}
            maxLength={4}
            placeholder="☕"
          />
        </div>

        <div className="sm:col-span-4">
          <label className="field-label" htmlFor="description">
            Descrição
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            className="field resize-y"
            defaultValue={category?.description ?? ''}
            placeholder="Aparece no topo da página da linha."
          />
        </div>

        <div className="sm:col-span-2">
          <label className="field-label" htmlFor="slug">
            Endereço <span className="font-normal text-ink-muted">(opcional)</span>
          </label>
          <input
            id="slug"
            name="slug"
            className="field font-mono text-sm"
            defaultValue={category?.slug}
            placeholder="gerado do nome"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="field-label" htmlFor="sortOrder">
            Ordem no menu
          </label>
          <input
            id="sortOrder"
            name="sortOrder"
            type="number"
            min={0}
            className="field font-mono"
            defaultValue={category?.sortOrder ?? 0}
          />
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-2.5 text-sm">
        <input
          type="checkbox"
          name="active"
          defaultChecked={category?.active ?? true}
          className="h-4 w-4 accent-brand-700"
        />
        <span className="font-medium text-brand-900">Visível na loja</span>
      </label>

      <div className="flex gap-2">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending && <LoaderCircle size={16} className="animate-spin" aria-hidden />}
          Salvar categoria
        </button>
        <button type="button" onClick={onDone} className="btn btn-ghost">
          Cancelar
        </button>
      </div>
    </form>
  )
}
