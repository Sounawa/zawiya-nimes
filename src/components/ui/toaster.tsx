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

/* Toaster habillé aux couleurs de la zawiya —
   blanc cassé, liseré vert/or, icône selon la gravité. */
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
              'items-start gap-3 overflow-hidden rounded-2xl border bg-white/95 p-4 pl-5 pr-9 shadow-xl shadow-[#0b5d42]/10 backdrop-blur',
              destructif
                ? 'border-[#b3452f]/35 shadow-[#b3452f]/15'
                : 'border-[#0b5d42]/25'
            )}
          >
            {/* Liseré vertical — vert pour les réussites, corail pour les échecs */}
            <span
              aria-hidden
              className={cn(
                'absolute bottom-0 left-0 top-0 w-1.5 rounded-l-2xl',
                destructif ? 'bg-gradient-to-b from-[#d4654c] to-[#b3452f]' : 'bg-gradient-to-b from-[#0b5d42] to-[#c9a24b]'
              )}
            />
            <span
              aria-hidden
              className={cn(
                'mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full',
                destructif ? 'bg-[#b3452f]/12 text-[#b3452f]' : 'bg-[#0b5d42]/10 text-[#0b5d42]'
              )}
            >
              {destructif ? <CircleAlert className="h-4 w-4" /> : <BadgeCheck className="h-4 w-4" />}
            </span>
            <div className="grid gap-1">
              {title && (
                <ToastTitle
                  className={cn('text-sm font-bold', destructif ? 'text-[#8a3423]' : 'text-[#123c2d]')}
                >
                  {title}
                </ToastTitle>
              )}
              {description && (
                <ToastDescription className="text-xs leading-relaxed text-[#78877d]">
                  {description}
                </ToastDescription>
              )}
            </div>
            {action}
            <ToastClose className="text-[#a09a87] hover:text-[#33453a]" />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
