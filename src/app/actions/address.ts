'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/auth'
import { addressSchema, fieldErrors } from '@/lib/validation'
import { normalizeZip } from '@/lib/shipping'

export type AddressState = { errors?: Record<string, string>; ok?: boolean; message?: string }

function readForm(formData: FormData) {
  return {
    label: String(formData.get('label') || 'Principal'),
    recipient: formData.get('recipient'),
    zip: normalizeZip(String(formData.get('zip') ?? '')),
    street: formData.get('street'),
    number: formData.get('number'),
    complement: formData.get('complement') || null,
    district: formData.get('district'),
    city: formData.get('city'),
    state: formData.get('state'),
  }
}

/** Garante um único endereço padrão por conta. */
async function clearOtherDefaults(userId: string, keepId?: string) {
  await prisma.address.updateMany({
    where: { userId, ...(keepId ? { id: { not: keepId } } : {}) },
    data: { isDefault: false },
  })
}

export async function saveAddressAction(
  _prev: AddressState,
  formData: FormData,
): Promise<AddressState> {
  const user = await requireUser()
  const parsed = addressSchema.safeParse(readForm(formData))

  if (!parsed.success) return { errors: fieldErrors(parsed.error) }

  const id = String(formData.get('id') ?? '')
  const isDefault = formData.get('isDefault') === 'on'
  const data = { ...parsed.data, userId: user.id, isDefault }

  if (id) {
    // O where inclui o userId: um id de outra conta simplesmente não encontra
    // linha para atualizar.
    const updated = await prisma.address.updateMany({
      where: { id, userId: user.id },
      data: parsed.data,
    })
    if (updated.count === 0) return { errors: { form: 'Endereço não encontrado.' } }
    if (isDefault) {
      await prisma.address.update({ where: { id }, data: { isDefault: true } })
      await clearOtherDefaults(user.id, id)
    }
  } else {
    const count = await prisma.address.count({ where: { userId: user.id } })
    const created = await prisma.address.create({
      // O primeiro endereço cadastrado vira o padrão sem o cliente precisar marcar.
      data: { ...data, isDefault: isDefault || count === 0 },
    })
    if (created.isDefault) await clearOtherDefaults(user.id, created.id)
  }

  revalidatePath('/conta/enderecos')
  return { ok: true, message: id ? 'Endereço atualizado.' : 'Endereço salvo.' }
}

export async function deleteAddressAction(id: string) {
  const user = await requireUser()
  await prisma.address.deleteMany({ where: { id, userId: user.id } })
  revalidatePath('/conta/enderecos')
}

export async function setDefaultAddressAction(id: string) {
  const user = await requireUser()
  const updated = await prisma.address.updateMany({
    where: { id, userId: user.id },
    data: { isDefault: true },
  })
  if (updated.count > 0) await clearOtherDefaults(user.id, id)
  revalidatePath('/conta/enderecos')
}
