import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { AdminHeader } from '@/components/admin/ui'
import { CouponManager } from '@/components/admin/coupon-forms'

export const metadata: Metadata = { title: 'Cupons' }

export default async function AdminCuponsPage() {
  await requireAdmin()

  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } })

  return (
    <>
      <AdminHeader
        title="Cupons"
        description="Descontos por percentual, valor fixo ou frete grátis, com validade e limite de resgates."
      />

      <CouponManager coupons={coupons} />
    </>
  )
}
