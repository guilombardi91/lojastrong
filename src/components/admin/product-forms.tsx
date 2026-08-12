'use client'

import { useActionState, useState } from 'react'
import { Eye, EyeOff, LoaderCircle, Plus, Trash2, X } from 'lucide-react'
import {
  deleteProductAction,
  deleteVariantAction,
  saveProductAction,
  saveVariantAction,
  toggleProductAction,
  type AdminState,
} from '@/app/actions/admin/catalogo'
import { FieldError, FormError, SuccessNote } from '@/components/ui/feedback'
import { StockBadge } from '@/components/ui/badge'
import { centsToInput, formatBRL } from '@/lib/money'

export function ToggleProduct({ id, active }: { id: string; active: boolean }) {
  return (
    <form action={toggleProductAction.bind(null, id)}>
      <button
        type="submit"
        className="btn btn-ghost btn-sm gap-1.5"
        title={active ? 'Tirar da vitrine' : 'Publicar na vitrine'}
      >
        {active ? <Eye size={15} aria-hidden /> : <EyeOff size={15} aria-hidden />}
        {active ? 'Publicado' : 'Oculto'}
      </button>
    </form>
  )
}

export type ProductFormData = {
  id?: string
  name: string
  slug: string
  tagline: string
  description: string
  categoryId: string
  basePrice: number
  compareAt: number | null
  weightGrams: number
  active: boolean
  featured: boolean
  images: string[]
}

export function ProductForm({
  product,
  categories,
  availableImages,
}: {
  product?: ProductFormData
  categories: { id: string; name: string }[]
  availableImages: string[]
}) {
  const [state, action, pending] = useActionState(saveProductAction, {} as AdminState)
  const [images, setImages] = useState<string[]>(product?.images ?? [])

  function toggleImage(url: string) {
    setImages((current) =>
      current.includes(url) ? current.filter((item) => item !== url) : [...current, url],
    )
  }

  return (
    <form action={action} className="flex flex-col gap-6">
      {product?.id && <input type="hidden" name="id" value={product.id} />}
      <input type="hidden" name="images" value={images.join('\n')} />

      <FormError>{state.errors?.form}</FormError>
      {state.ok && <SuccessNote>{state.message}</SuccessNote>}

      <section className="card flex flex-col gap-4 p-5">
        <h2 className="font-display text-lg font-bold text-brand-950">Identificação</h2>

        <div className="grid gap-4 sm:grid-cols-6">
          <div className="sm:col-span-4">
            <label className="field-label" htmlFor="name">
              Nome do produto
            </label>
            <input
              id="name"
              name="name"
              className="field"
              defaultValue={product?.name}
              required
              placeholder="Camiseta Strong Classic"
            />
            <FieldError>{state.errors?.name}</FieldError>
          </div>

          <div className="sm:col-span-2">
            <label className="field-label" htmlFor="categoryId">
              Categoria
            </label>
            <select
              id="categoryId"
              name="categoryId"
              className="field"
              defaultValue={product?.categoryId ?? ''}
              required
            >
              <option value="">Selecione</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <FieldError>{state.errors?.categoryId}</FieldError>
          </div>

          <div className="sm:col-span-6">
            <label className="field-label" htmlFor="tagline">
              Frase do card <span className="font-normal text-ink-muted">(opcional)</span>
            </label>
            <input
              id="tagline"
              name="tagline"
              className="field"
              defaultValue={product?.tagline}
              placeholder="Algodão penteado 180g com estampa em silk de alta durabilidade."
            />
          </div>

          <div className="sm:col-span-6">
            <label className="field-label" htmlFor="description">
              Descrição
            </label>
            <textarea
              id="description"
              name="description"
              rows={5}
              className="field resize-y"
              defaultValue={product?.description}
              required
              placeholder="Material, modelagem, cuidados de lavagem — o que o comprador precisa saber antes de escolher o tamanho."
            />
            <FieldError>{state.errors?.description}</FieldError>
          </div>

          <div className="sm:col-span-3">
            <label className="field-label" htmlFor="slug">
              Endereço na loja <span className="font-normal text-ink-muted">(opcional)</span>
            </label>
            <input
              id="slug"
              name="slug"
              className="field font-mono text-sm"
              defaultValue={product?.slug}
              placeholder="gerado a partir do nome"
            />
          </div>

          <div className="sm:col-span-3 flex items-end gap-6 pb-2">
            <label className="flex cursor-pointer items-center gap-2.5 text-sm">
              <input
                type="checkbox"
                name="active"
                defaultChecked={product?.active ?? true}
                className="h-4 w-4 accent-brand-700"
              />
              <span className="font-medium text-brand-900">Publicado</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2.5 text-sm">
              <input
                type="checkbox"
                name="featured"
                defaultChecked={product?.featured ?? false}
                className="h-4 w-4 accent-brand-700"
              />
              <span className="font-medium text-brand-900">Destaque</span>
            </label>
          </div>
        </div>
      </section>

      <section className="card flex flex-col gap-4 p-5">
        <h2 className="font-display text-lg font-bold text-brand-950">Preço e logística</h2>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="field-label" htmlFor="basePrice">
              Preço de venda
            </label>
            <input
              id="basePrice"
              name="basePrice"
              className="field font-mono"
              defaultValue={product ? centsToInput(product.basePrice) : ''}
              required
              placeholder="89,90"
            />
            <FieldError>{state.errors?.basePrice}</FieldError>
          </div>

          <div>
            <label className="field-label" htmlFor="compareAt">
              Preço &quot;de&quot; <span className="font-normal text-ink-muted">(opcional)</span>
            </label>
            <input
              id="compareAt"
              name="compareAt"
              className="field font-mono"
              defaultValue={product?.compareAt ? centsToInput(product.compareAt) : ''}
              placeholder="109,90"
            />
            <FieldError>{state.errors?.compareAt}</FieldError>
            <p className="mt-1.5 text-xs text-ink-muted">Riscado no card, para mostrar desconto.</p>
          </div>

          <div>
            <label className="field-label" htmlFor="weightGrams">
              Peso (gramas)
            </label>
            <input
              id="weightGrams"
              name="weightGrams"
              type="number"
              min={1}
              className="field font-mono"
              defaultValue={product?.weightGrams ?? 300}
              required
            />
            <FieldError>{state.errors?.weightGrams}</FieldError>
            <p className="mt-1.5 text-xs text-ink-muted">Entra no cálculo do frete.</p>
          </div>
        </div>
      </section>

      <section className="card flex flex-col gap-4 p-5">
        <div>
          <h2 className="font-display text-lg font-bold text-brand-950">Imagens</h2>
          <p className="mt-1 text-sm text-ink-muted">
            A primeira selecionada vira a capa. Clique para incluir ou remover.
          </p>
        </div>

        {images.length > 0 && (
          <ol className="flex flex-wrap gap-2">
            {images.map((url, index) => (
              <li key={url} className="relative">
                <span className="tag absolute -left-1 -top-1 z-10 grid h-5 w-5 place-items-center rounded-full bg-brand-900 text-white">
                  {index + 1}
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt=""
                  className="h-20 w-20 rounded-lg border border-brand-900 bg-paper object-contain p-1"
                />
                <button
                  type="button"
                  onClick={() => toggleImage(url)}
                  className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-danger text-white"
                  aria-label={`Remover imagem ${index + 1}`}
                >
                  <X size={12} />
                </button>
              </li>
            ))}
          </ol>
        )}

        <div>
          <p className="tag mb-2 text-ink-muted">Disponíveis</p>
          <ul className="flex flex-wrap gap-2">
            {availableImages
              .filter((url) => !images.includes(url))
              .map((url) => (
                <li key={url}>
                  <button
                    type="button"
                    onClick={() => toggleImage(url)}
                    className="rounded-lg border border-brand-100 bg-paper p-1 transition-colors hover:border-brand-600"
                    title={url.split('/').pop()}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="h-16 w-16 object-contain" />
                  </button>
                </li>
              ))}
          </ul>
        </div>
      </section>

      <button type="submit" className="btn btn-primary self-start" disabled={pending}>
        {pending && <LoaderCircle size={16} className="animate-spin" aria-hidden />}
        {product?.id ? 'Salvar alterações' : 'Criar produto'}
      </button>
    </form>
  )
}

/**
 * Exclusão em formulário próprio, irmão do de edição.
 * <form> dentro de <form> é HTML inválido e quebra a hidratação.
 */
export function DeleteProduct({ id }: { id: string }) {
  return (
    <form action={deleteProductAction.bind(null, id)} className="card p-5">
      <h2 className="font-display text-base font-bold text-brand-950">Remover do catálogo</h2>
      <p className="mb-3 mt-1 text-sm text-ink-muted">
        Produtos com histórico de venda são apenas despublicados — apagá-los deixaria pedidos
        antigos sem referência.
      </p>
      <button type="submit" className="btn btn-outline text-ink-muted hover:border-danger hover:text-danger">
        <Trash2 size={16} aria-hidden />
        Excluir produto
      </button>
    </form>
  )
}

// ---------------------------------------------------------------- variantes

export type VariantData = {
  id: string
  sku: string
  size: string
  color: string | null
  colorHex: string | null
  price: number | null
  stock: number
  lowStock: number
  active: boolean
}

export function VariantManager({
  productId,
  variants,
  basePrice,
}: {
  productId: string
  variants: VariantData[]
  basePrice: number
}) {
  const [editing, setEditing] = useState<VariantData | 'nova' | null>(null)

  return (
    <section className="card flex flex-col gap-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-brand-950">Grade e estoque</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Cada combinação de tamanho e cor é uma unidade de estoque própria.
          </p>
        </div>
        {!editing && (
          <button type="button" onClick={() => setEditing('nova')} className="btn btn-outline btn-sm">
            <Plus size={15} aria-hidden />
            Nova variante
          </button>
        )}
      </div>

      {variants.length > 0 && (
        <div className="scroll-x">
          <table className="w-full min-w-[38rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-brand-100 text-left">
                <th className="tag py-2 font-semibold text-ink-muted">SKU</th>
                <th className="tag py-2 font-semibold text-ink-muted">Tamanho</th>
                <th className="tag py-2 font-semibold text-ink-muted">Cor</th>
                <th className="tag py-2 font-semibold text-ink-muted">Preço</th>
                <th className="tag py-2 font-semibold text-ink-muted">Estoque</th>
                <th className="tag py-2 text-right font-semibold text-ink-muted">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-100">
              {variants.map((variant) => (
                <tr key={variant.id} className={variant.active ? '' : 'opacity-50'}>
                  <td className="py-2.5 font-mono text-xs font-semibold text-brand-700">
                    {variant.sku}
                  </td>
                  <td className="py-2.5">{variant.size}</td>
                  <td className="py-2.5">
                    <span className="flex items-center gap-2">
                      {variant.colorHex && (
                        <span
                          className="h-3.5 w-3.5 rounded-full border border-brand-100"
                          style={{ backgroundColor: variant.colorHex }}
                          aria-hidden
                        />
                      )}
                      {variant.color ?? '—'}
                    </span>
                  </td>
                  <td className="py-2.5 font-mono text-xs">
                    {variant.price ? formatBRL(variant.price) : formatBRL(basePrice)}
                  </td>
                  <td className="py-2.5">
                    <StockBadge stock={variant.stock} lowStock={variant.lowStock} />
                  </td>
                  <td className="py-2.5 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setEditing(variant)}
                        className="btn btn-ghost btn-sm"
                      >
                        Editar
                      </button>
                      <form action={deleteVariantAction.bind(null, variant.id)}>
                        <button
                          type="submit"
                          className="btn btn-ghost btn-sm px-2 text-ink-muted hover:text-danger"
                          aria-label={`Excluir variante ${variant.sku}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <VariantForm
          productId={productId}
          variant={editing === 'nova' ? null : editing}
          onDone={() => setEditing(null)}
        />
      )}
    </section>
  )
}

function VariantForm({
  productId,
  variant,
  onDone,
}: {
  productId: string
  variant: VariantData | null
  onDone: () => void
}) {
  const [state, action, pending] = useActionState(saveVariantAction, {} as AdminState)

  return (
    <form action={action} className="flex flex-col gap-4 rounded-xl border border-brand-100 bg-brand-50/50 p-4">
      <input type="hidden" name="productId" value={productId} />
      {variant && <input type="hidden" name="id" value={variant.id} />}

      <div className="flex items-center justify-between gap-3">
        <h3 className="font-display text-base font-bold text-brand-950">
          {variant ? `Editar ${variant.sku}` : 'Nova variante'}
        </h3>
        <button type="button" onClick={onDone} className="btn btn-ghost btn-sm px-2" aria-label="Fechar">
          <X size={16} />
        </button>
      </div>

      <FormError>{state.errors?.form}</FormError>
      {state.ok && <SuccessNote>{state.message}</SuccessNote>}

      <div className="grid gap-3 sm:grid-cols-6">
        <div className="sm:col-span-2">
          <label className="field-label" htmlFor="sku">
            SKU
          </label>
          <input
            id="sku"
            name="sku"
            className="field font-mono text-sm uppercase"
            defaultValue={variant?.sku}
            required
            placeholder="SBS-CAM-CLA-NAV-M"
          />
          <FieldError>{state.errors?.sku}</FieldError>
        </div>

        <div className="sm:col-span-1">
          <label className="field-label" htmlFor="size">
            Tamanho
          </label>
          <input
            id="size"
            name="size"
            className="field"
            defaultValue={variant?.size ?? 'Único'}
            required
          />
        </div>

        <div className="sm:col-span-2">
          <label className="field-label" htmlFor="color">
            Cor
          </label>
          <input
            id="color"
            name="color"
            className="field"
            defaultValue={variant?.color ?? ''}
            placeholder="Marinho"
          />
        </div>

        <div className="sm:col-span-1">
          <label className="field-label" htmlFor="colorHex">
            Amostra
          </label>
          <input
            id="colorHex"
            name="colorHex"
            type="color"
            className="field h-[42px] p-1"
            defaultValue={variant?.colorHex ?? '#0d2f52'}
          />
          <FieldError>{state.errors?.colorHex}</FieldError>
        </div>

        <div className="sm:col-span-2">
          <label className="field-label" htmlFor="price">
            Preço próprio <span className="font-normal text-ink-muted">(opcional)</span>
          </label>
          <input
            id="price"
            name="price"
            className="field font-mono"
            defaultValue={variant?.price ? centsToInput(variant.price) : ''}
            placeholder="usa o preço do produto"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="field-label" htmlFor="stock">
            Estoque
          </label>
          <input
            id="stock"
            name="stock"
            type="number"
            min={0}
            className="field font-mono"
            defaultValue={variant?.stock ?? 0}
            required
          />
          <FieldError>{state.errors?.stock}</FieldError>
        </div>

        <div className="sm:col-span-2">
          <label className="field-label" htmlFor="lowStock">
            Alerta de reposição
          </label>
          <input
            id="lowStock"
            name="lowStock"
            type="number"
            min={0}
            className="field font-mono"
            defaultValue={variant?.lowStock ?? 5}
          />
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-2.5 text-sm">
        <input
          type="checkbox"
          name="active"
          defaultChecked={variant?.active ?? true}
          className="h-4 w-4 accent-brand-700"
        />
        <span className="font-medium text-brand-900">Disponível para venda</span>
      </label>

      <div className="flex gap-2">
        <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>
          {pending && <LoaderCircle size={15} className="animate-spin" aria-hidden />}
          Salvar variante
        </button>
        <button type="button" onClick={onDone} className="btn btn-ghost btn-sm">
          Fechar
        </button>
      </div>
    </form>
  )
}
