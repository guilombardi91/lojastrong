'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { inputToCents } from '@/lib/money'
import { slugify } from '@/lib/utils'
import { notifyStockAlerts } from '@/lib/stock-alerts'
import { categorySchema, fieldErrors, productSchema, variantSchema } from '@/lib/validation'

export type AdminState = { errors?: Record<string, string>; ok?: boolean; message?: string }

/**
 * Garante um slug único acrescentando um sufixo numérico quando necessário.
 * Slugs são a URL pública do produto: precisam ser estáveis e não colidir.
 */
async function uniqueSlug(
  base: string,
  model: 'product' | 'category',
  ignoreId?: string,
): Promise<string> {
  const root = slugify(base) || 'item'
  let candidate = root
  let suffix = 2

  for (;;) {
    const existing =
      model === 'product'
        ? await prisma.product.findUnique({ where: { slug: candidate }, select: { id: true } })
        : await prisma.category.findUnique({ where: { slug: candidate }, select: { id: true } })

    if (!existing || existing.id === ignoreId) return candidate
    candidate = `${root}-${suffix++}`
  }
}

// ------------------------------------------------------------------ produtos

export async function saveProductAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await requireAdmin()

  const id = String(formData.get('id') ?? '')
  const compareAtRaw = String(formData.get('compareAt') ?? '').trim()

  const parsed = productSchema.safeParse({
    name: formData.get('name'),
    slug: formData.get('slug'),
    tagline: formData.get('tagline') || null,
    description: formData.get('description'),
    categoryId: formData.get('categoryId'),
    basePrice: inputToCents(String(formData.get('basePrice') ?? '')),
    compareAt: compareAtRaw ? inputToCents(compareAtRaw) : null,
    weightGrams: formData.get('weightGrams'),
    active: formData.get('active') === 'on',
    featured: formData.get('featured') === 'on',
  })

  if (!parsed.success) return { errors: fieldErrors(parsed.error) }

  const data = parsed.data
  if (data.compareAt && data.compareAt <= data.basePrice) {
    return { errors: { compareAt: 'O preço "de" precisa ser maior que o preço de venda.' } }
  }

  const slug = await uniqueSlug(data.slug || data.name, 'product', id || undefined)

  // As imagens chegam como uma URL por linha: é o formato que a equipe já usa
  // para colar a saída do banco de imagens.
  const imageLines = String(formData.get('images') ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  const payload = {
    name: data.name,
    slug,
    tagline: data.tagline,
    description: data.description,
    categoryId: data.categoryId,
    basePrice: data.basePrice,
    compareAt: data.compareAt,
    weightGrams: data.weightGrams,
    active: data.active,
    featured: data.featured,
  }

  let productId = id

  if (id) {
    await prisma.product.update({ where: { id }, data: payload })
  } else {
    const created = await prisma.product.create({
      data: {
        ...payload,
        // Todo produto precisa de ao menos uma variante para ser vendável.
        variants: {
          create: {
            sku: `${slugify(data.name).toUpperCase().replace(/-/g, '').slice(0, 12)}-U`,
            size: 'Único',
            stock: 0,
          },
        },
      },
    })
    productId = created.id
  }

  await prisma.productImage.deleteMany({ where: { productId } })
  if (imageLines.length > 0) {
    await prisma.productImage.createMany({
      data: imageLines.map((url, index) => ({
        productId,
        url,
        alt: `${data.name} — imagem ${index + 1}`,
        sortOrder: index,
      })),
    })
  }

  revalidatePath('/admin/produtos')
  revalidatePath('/produtos')
  revalidatePath(`/produtos/${slug}`)

  if (!id) redirect(`/admin/produtos/${productId}`)
  return { ok: true, message: 'Produto salvo.' }
}

export async function toggleProductAction(id: string) {
  await requireAdmin()
  const product = await prisma.product.findUnique({ where: { id }, select: { active: true } })
  if (!product) return

  await prisma.product.update({ where: { id }, data: { active: !product.active } })
  revalidatePath('/admin/produtos')
  revalidatePath('/produtos')
}

export async function deleteProductAction(id: string) {
  await requireAdmin()

  // Produto com histórico de venda não é apagado: OrderItem guarda os dados
  // congelados, mas manter o registro preserva o relatório de estoque.
  const sold = await prisma.orderItem.count({ where: { variant: { productId: id } } })
  if (sold > 0) {
    await prisma.product.update({ where: { id }, data: { active: false } })
  } else {
    await prisma.product.delete({ where: { id } })
  }

  revalidatePath('/admin/produtos')
  revalidatePath('/produtos')
  redirect('/admin/produtos')
}

// ----------------------------------------------------------------- variantes

export async function saveVariantAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await requireAdmin()

  const productId = String(formData.get('productId') ?? '')
  const id = String(formData.get('id') ?? '')
  const priceRaw = String(formData.get('price') ?? '').trim()

  const parsed = variantSchema.safeParse({
    sku: formData.get('sku'),
    size: formData.get('size') || 'Único',
    color: formData.get('color') || null,
    colorHex: formData.get('colorHex') || null,
    price: priceRaw ? inputToCents(priceRaw) : null,
    stock: formData.get('stock'),
    lowStock: formData.get('lowStock') || 5,
    active: formData.get('active') === 'on',
  })

  if (!parsed.success) return { errors: fieldErrors(parsed.error) }

  const data = {
    sku: parsed.data.sku,
    size: parsed.data.size,
    color: parsed.data.color || null,
    colorHex: parsed.data.colorHex || null,
    price: parsed.data.price,
    lowStock: parsed.data.lowStock,
    active: parsed.data.active,
  }

  const duplicate = await prisma.productVariant.findUnique({
    where: { sku: data.sku },
    select: { id: true },
  })
  if (duplicate && duplicate.id !== id) {
    return { errors: { sku: 'Já existe uma variante com este SKU.' } }
  }

  if (id) {
    const before = await prisma.productVariant.findUnique({ where: { id } })
    if (!before) return { errors: { form: 'Variante não encontrada.' } }

    await prisma.productVariant.update({ where: { id }, data })

    // Mudança de estoque pela tela vira movimentação, para o histórico fechar.
    const delta = parsed.data.stock - before.stock
    if (delta !== 0) {
      await prisma.$transaction([
        prisma.productVariant.update({ where: { id }, data: { stock: parsed.data.stock } }),
        prisma.stockMovement.create({
          data: {
            variantId: id,
            delta,
            reason: 'ADJUSTMENT',
            note: `Ajuste manual: ${before.stock} → ${parsed.data.stock}`,
          },
        }),
      ])

      if (before.stock <= 0 && parsed.data.stock > 0) {
        await notifyStockAlerts(id)
      }
    }
  } else {
    const created = await prisma.productVariant.create({
      data: { ...data, productId, stock: parsed.data.stock },
    })
    if (parsed.data.stock > 0) {
      await prisma.stockMovement.create({
        data: {
          variantId: created.id,
          delta: parsed.data.stock,
          reason: 'RESTOCK',
          note: 'Estoque inicial da variante',
        },
      })
    }
  }

  revalidatePath(`/admin/produtos/${productId}`)
  revalidatePath('/admin/estoque')
  revalidatePath('/produtos')
  return { ok: true, message: 'Variante salva.' }
}

export async function deleteVariantAction(id: string) {
  await requireAdmin()

  const variant = await prisma.productVariant.findUnique({
    where: { id },
    select: { productId: true, _count: { select: { orderItems: true } } },
  })
  if (!variant) return

  if (variant._count.orderItems > 0) {
    await prisma.productVariant.update({ where: { id }, data: { active: false, stock: 0 } })
  } else {
    await prisma.productVariant.delete({ where: { id } })
  }

  revalidatePath(`/admin/produtos/${variant.productId}`)
  revalidatePath('/admin/estoque')
}

/** Reposição rápida a partir da tela de estoque. */
export async function restockAction(_prev: AdminState, formData: FormData): Promise<AdminState> {
  await requireAdmin()

  const variantId = String(formData.get('variantId') ?? '')
  const amount = Number(formData.get('amount'))

  if (!Number.isFinite(amount) || amount === 0) {
    return { errors: { amount: 'Informe quantas unidades entraram ou saíram.' } }
  }

  const variant = await prisma.productVariant.findUnique({ where: { id: variantId } })
  if (!variant) return { errors: { form: 'Variante não encontrada.' } }

  const next = Math.max(0, variant.stock + amount)

  await prisma.$transaction([
    prisma.productVariant.update({ where: { id: variantId }, data: { stock: next } }),
    prisma.stockMovement.create({
      data: {
        variantId,
        delta: next - variant.stock,
        reason: amount > 0 ? 'RESTOCK' : 'ADJUSTMENT',
        note: String(formData.get('note') || '') || 'Ajuste pela tela de estoque',
      },
    }),
  ])

  if (variant.stock <= 0 && next > 0) {
    await notifyStockAlerts(variantId)
  }

  revalidatePath('/admin/estoque')
  revalidatePath('/produtos')
  return { ok: true, message: `Estoque atualizado para ${next} unidades.` }
}

// --------------------------------------------------------------- categorias

export async function saveCategoryAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await requireAdmin()

  const id = String(formData.get('id') ?? '')
  const parsed = categorySchema.safeParse({
    name: formData.get('name'),
    slug: formData.get('slug'),
    description: formData.get('description') || null,
    emblem: formData.get('emblem') || null,
    sortOrder: formData.get('sortOrder') || 0,
    active: formData.get('active') === 'on',
  })

  if (!parsed.success) return { errors: fieldErrors(parsed.error) }

  const data = parsed.data
  const slug = await uniqueSlug(data.slug || data.name, 'category', id || undefined)

  const payload = {
    name: data.name,
    slug,
    description: data.description,
    emblem: data.emblem,
    sortOrder: data.sortOrder,
    active: data.active,
  }

  if (id) {
    await prisma.category.update({ where: { id }, data: payload })
  } else {
    await prisma.category.create({ data: payload })
  }

  revalidatePath('/admin/categorias')
  revalidatePath('/', 'layout')
  return { ok: true, message: 'Categoria salva.' }
}

export async function deleteCategoryAction(id: string) {
  await requireAdmin()

  const count = await prisma.product.count({ where: { categoryId: id } })
  if (count > 0) {
    // Excluir arrastaria os produtos junto; desativar tira da vitrine e
    // preserva o catálogo.
    await prisma.category.update({ where: { id }, data: { active: false } })
  } else {
    await prisma.category.delete({ where: { id } })
  }

  revalidatePath('/admin/categorias')
  revalidatePath('/', 'layout')
}
