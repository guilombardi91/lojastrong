import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Junta classes condicionais resolvendo conflitos do Tailwind. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/** "Caneca Térmica Strong" → "caneca-termica-strong" */
export function slugify(value: string): string {
  return value
    .normalize('NFD')
    // Remove os acentos que o NFD separou das letras.
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export function formatDate(date: Date | string): string {
  return dateFormatter.format(new Date(date))
}

export function formatDateTime(date: Date | string): string {
  return dateTimeFormatter.format(new Date(date))
}

/** Data de entrega estimada somando apenas dias úteis. */
export function addBusinessDays(days: number, from = new Date()): Date {
  const date = new Date(from)
  let remaining = days
  while (remaining > 0) {
    date.setDate(date.getDate() + 1)
    const weekday = date.getDay()
    if (weekday !== 0 && weekday !== 6) remaining--
  }
  return date
}

export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '')
  }
  return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '')
}

export function formatDocument(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

/** Validação de CPF pelos dígitos verificadores. */
export function isValidCPF(value: string): boolean {
  const cpf = value.replace(/\D/g, '')
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false

  for (const [length, position] of [
    [9, 10],
    [10, 11],
  ]) {
    let sum = 0
    for (let i = 0; i < length; i++) {
      sum += Number(cpf[i]) * (position - i)
    }
    const remainder = (sum * 10) % 11
    const digit = remainder === 10 ? 0 : remainder
    if (digit !== Number(cpf[length])) return false
  }

  return true
}
