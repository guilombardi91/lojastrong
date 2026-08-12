'use client'

import { Power, ShieldCheck, ShieldOff } from 'lucide-react'
import { setRoleAction, toggleCustomerAction } from '@/app/actions/admin/operacao'

export function CustomerActions({
  id,
  active,
  role,
  isSelf,
}: {
  id: string
  active: boolean
  role: string
  isSelf: boolean
}) {
  if (isSelf) {
    return <span className="tag text-ink-muted">Sua conta</span>
  }

  return (
    <div className="flex justify-end gap-1">
      <form action={setRoleAction.bind(null, id, role === 'ADMIN' ? 'CUSTOMER' : 'ADMIN')}>
        <button
          type="submit"
          className="btn btn-ghost btn-sm gap-1.5"
          title={role === 'ADMIN' ? 'Remover acesso administrativo' : 'Dar acesso administrativo'}
        >
          {role === 'ADMIN' ? <ShieldOff size={15} aria-hidden /> : <ShieldCheck size={15} aria-hidden />}
          {role === 'ADMIN' ? 'Remover admin' : 'Tornar admin'}
        </button>
      </form>

      <form action={toggleCustomerAction.bind(null, id)}>
        <button
          type="submit"
          className="btn btn-ghost btn-sm px-2"
          aria-label={active ? 'Desativar conta' : 'Reativar conta'}
          title={active ? 'Desativar conta' : 'Reativar conta'}
        >
          <Power size={15} />
        </button>
      </form>
    </div>
  )
}
