'use client'

import { BadgeCheck, CircleAlert } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast'
import { cn } from '@/lib/utils'

/* Toaster habillé aux couleurs de la zawiya — carte du thème, liseré
   vert/or, icône selon la gravité. Suit le jour comme la nuit. */
export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        const destructif = props.variant === 'destructive'
        return (
          <Toast
            key={id}
            {...props}
            className={cn(
              'items-start gap-3 overflow-hidden rounded-2xl border bg-card/95 p-4 pl-5 pr-9 shadow-lg shadow-[#17553f]/10 backdrop-blur',
              destructif ? 'border-destructive/35' : 'border-primary/25'
            )}
          >
            {/* Liseré vertical — vert pour les réussites, corail pour les échecs */}
            <span
              aria-hidden
              className={cn(
                'absolute bottom-0 left-0 top-0 w-1.5 rounded-l-2xl',
                destructif ? 'bg-gradient-to-b from-[#d4654c] to-[#b3452f]' : 'bg-gradient-to-b from-primary to-gold'
              )}
            />
            <span
              aria-hidden
              className={cn(
                'mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full',
                destructif ? 'bg-destructive/12 text-destructive' : 'bg-primary/10 text-primary'
              )}
            >
              {destructif ? <CircleAlert className="h-4 w-4" /> : <BadgeCheck className="h-4 w-4" />}
            </span>
            <div className="grid gap-1">
              {title && (
                <ToastTitle className={cn('text-sm font-bold', destructif ? 'text-destructive' : 'text-primary')}>
                  {title}
                </ToastTitle>
              )}
              {description && (
                <ToastDescription className="text-xs leading-relaxed text-muted-foreground">
                  {description}
                </ToastDescription>
              )}
            </div>
            {action}
            <ToastClose className="text-muted-foreground hover:text-foreground" />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
