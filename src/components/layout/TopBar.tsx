import { LogOut, Shield, User } from 'lucide-react'

import { useAuth } from '../../lib/auth-client'
import { StatusBadge } from '../ui'

export function TopBar() {
  const { user, logout } = useAuth()

  return (
    <header className="sticky top-0 z-40 w-full border-b border-club-border bg-pitch/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-container-app items-center justify-between px-app-gutter">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-gold/40 bg-surface-raised font-display text-lg font-bold text-gold shadow-md">
            BO
          </div>
          <div>
            <h1 className="m-0 font-display text-lg font-bold uppercase tracking-wider text-chalk">
              Best Official
            </h1>
            <span className="block text-[0.6875rem] font-semibold uppercase tracking-widest text-gold">
              Youth Football Club
            </span>
          </div>
        </div>

        {/* User Identity & Logout */}
        {user ? (
          <div className="flex items-center gap-2.5">
            {user.role === 'admin' ? (
              <StatusBadge
                tone="warning"
                className="gap-1 px-2.5 py-0.5 text-xs font-bold"
              >
                <Shield className="h-3 w-3 text-gold" />
                <span>Maamule</span>
              </StatusBadge>
            ) : (
              <div className="flex items-center gap-1.5 rounded-full border border-club-border bg-surface px-2.5 py-1 text-xs text-chalk">
                <User className="h-3.5 w-3.5 text-gold" />
                <span className="max-w-[110px] truncate font-medium">
                  {user.name}
                </span>
              </div>
            )}

            <button
              onClick={() => logout()}
              title="Ka Bax (Logout)"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-club-border bg-surface text-chalk-dim hover:border-danger hover:text-danger active:scale-95 transition-colors cursor-pointer"
              type="button"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : null}
      </div>
    </header>
  )
}
