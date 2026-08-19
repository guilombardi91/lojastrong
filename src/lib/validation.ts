import { z } from 'zod'
import { isValidCPF } from './utils'
import { isValidZip } from './shipping'
import { PAYMENT_METHODS, UF } from './enums'

// Um único lugar para as regras de entrada. As Server Actions são endpoints
// POST públicos, então tudo que chega do navegador passa por aqui antes de
// tocar no banco.

export const emailSchema = z.email({ message: 'Informe um e-mail válido.' }).toLowerCase().trim()

export const passwordSchema = z
  .string()
  .min(8, 'A senha precisa de pelo menos 8 caracteres.')
  .max(72, 'A senha pode ter no máximo 72 caracteres.')

export const signUpSchema = z
  .object({
    name: z.string().trim().min(3, 'Informe seu nome completo.').max(120),
    email: emailSchema,
    password: passwordSchema,
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    message: 'As senhas não conferem.',
    path: ['confirm'],
  })

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Informe sua senha.'),
})

export const profileSchema = z.object({
  name: z.string().trim().min(3, 'Informe seu nome completo.').max(120),
  phone: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || v.replace(/\D/g, '').length >= 10, 'Telefone incompleto.'),
  document: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || isValidCPF(v), 'CPF inválido.'),
})

export const forgotPasswordSchema = z.object({ email: emailSchema })

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Link inválido.'),
    password: passwordSchema,
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    message: 'As senhas não conferem.',
    path: ['confirm'],
  })

export const passwordChangeSchema = z
  .object({
    current: z.string().min(1, 'Informe a senha atual.'),
    password: passwordSchema,
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    message: 'As senhas não conferem.',
    path: ['confirm'],
  })

export const addressSchema = z.object({
  label: z.string().trim().max(40).default('Principal'),
  recipient: z.string().trim().min(3, 'Informe quem vai receber.').max(120),
  zip: z.string().refine(isValidZip, 'CEP precisa ter 8 dígitos.'),
  street: z.string().trim().min(3, 'Informe o logradouro.').max(160),
  number: z.string().trim().min(1, 'Informe o número.').max(20),
  complement: z.string().trim().max(80).optional().nullable(),
  district: z.string().trim().min(2, 'Informe o bairro.').max(80),
  city: z.string().trim().min(2, 'Informe a cidade.').max(80),
  state: z.enum(UF, { message: 'Selecione o estado.' }),
})

export const checkoutSchema = addressSchema.extend({
  shippingId: z.enum(['PADRAO', 'EXPRESSA']),
  method: z.enum(PAYMENT_METHODS),
  couponCode: z.string().trim().max(40).optional().nullable(),
  notes: z.string().trim().max(400).optional().nullable(),
  saveAddress: z.coerce.boolean().optional(),
})

// ------------------------------------------------------------------ catálogo

export const categorySchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome da categoria.').max(60),
  slug: z.string().trim().max(80).optional(),
  description: z.string().trim().max(400).optional().nullable(),
  emblem: z.string().trim().max(4).optional().nullable(),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
  active: z.coerce.boolean().default(true),
})

export const productSchema = z.object({
  name: z.string().trim().min(3, 'Informe o nome do produto.').max(140),
  slug: z.string().trim().max(160).optional(),
  tagline: z.string().trim().max(120).optional().nullable(),
  description: z.string().trim().min(10, 'Descreva o produto em pelo menos 10 caracteres.'),
  categoryId: z.string().min(1, 'Selecione uma categoria.'),
  basePrice: z.number().int().min(1, 'O preço precisa ser maior que zero.'),
  compareAt: z.number().int().min(0).optional().nullable(),
  weightGrams: z.coerce.number().int().min(1, 'Informe o peso em gramas.').max(50000),
  active: z.coerce.boolean().default(true),
  featured: z.coerce.boolean().default(false),
})

export const variantSchema = z.object({
  sku: z.string().trim().min(2, 'Informe o SKU.').max(40).toUpperCase(),
  size: z.string().trim().min(1).max(20).default('Único'),
  color: z.string().trim().max(40).optional().nullable(),
  colorHex: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Use um hex no formato #RRGGBB.')
    .optional()
    .nullable()
    .or(z.literal('')),
  price: z.number().int().min(0).optional().nullable(),
  stock: z.coerce.number().int().min(0, 'Estoque não pode ser negativo.').max(100000),
  lowStock: z.coerce.number().int().min(0).max(1000).default(5),
  active: z.coerce.boolean().default(true),
})

export const couponSchema = z
  .object({
    code: z
      .string()
      .trim()
      .toUpperCase()
      .min(3, 'O código precisa de ao menos 3 caracteres.')
      .max(40)
      .regex(/^[A-Z0-9-]+$/, 'Use apenas letras, números e hífen.'),
    description: z.string().trim().max(160).optional().nullable(),
    type: z.enum(['PERCENT', 'FIXED', 'FREE_SHIPPING']),
    value: z.number().int().min(0),
    minSubtotal: z.number().int().min(0).default(0),
    maxUses: z.coerce.number().int().min(1).optional().nullable(),
    expiresAt: z.string().optional().nullable(),
    active: z.coerce.boolean().default(true),
  })
  .refine((data) => data.type !== 'PERCENT' || (data.value > 0 && data.value <= 100), {
    message: 'Para desconto percentual, use um valor entre 1 e 100.',
    path: ['value'],
  })
  .refine((data) => data.type !== 'FIXED' || data.value > 0, {
    message: 'Informe o valor do desconto.',
    path: ['value'],
  })

/** Achata os erros do Zod em { campo: mensagem } para os formulários. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path.join('.') || 'form'
    if (!result[key]) result[key] = issue.message
  }
  return result
}
