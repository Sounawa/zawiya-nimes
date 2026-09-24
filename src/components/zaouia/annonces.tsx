'use client'

import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Announcement } from '@/lib/types'

function api<T>(url: string, init?: RequestInit): Promise<T> {
  return fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  }).then((r) => {
    if (!r.ok) throw new Error('Erreur réseau')
    return r.json()
  })
}

export function useAnnouncements() {
  return useQuery({
    queryKey: ['announcements'],
    queryFn: () => api<Announcement[]>('/api/announcements'),
  })
}

export function useDeleteAnnouncement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api(`/api/announcements/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['announcements'] }),
  })
}

export function Annonces() {
  const { data: annonces } = useAnnouncements()
  const del = useDeleteAnnouncement()

  if (!annonces?.length) return null

  return (
    <section aria-label="Annonces" className="space-y-3">
      {annonces.map((a, i) => (
        <motion.article
          key={a.id}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08, duration: 0.45 }}
          className={
            a.color === 'VERT'
              ? 'group relative overflow-hidden rounded-2xl border border-[#0b5d42]/20 bg-gradient-to-br from-white to-[#f2f7f3] p-5 shadow-sm'
              : 'group relative overflow-hidden rounded-2xl border border-[#c9a24b]/35 bg-gradient-to-br from-white to-[#faf3e3] p-5 shadow-sm'
          }
        >
          {/* Liseré latéral */}
          <span
            aria-hidden
            className={
              a.color === 'VERT'
                ? 'absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-[#0b5d42] to-[#4a7c6b]'
                : 'absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-[#c9a24b] to-[#e2c98a]'
            }
          />
          <div className="flex items-start gap-3 pl-2">
            <span
              className={
                a.color === 'VERT'
                  ? 'mt-1.5 block h-2 w-2 rotate-45 bg-[#0b5d42]'
                  : 'mt-1.5 block h-2 w-2 rounded-full bg-[#c9a24b]'
              }
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              {a.title && (
                <h2
                  className={
                    a.color === 'VERT'
                      ? 'text-[13px] font-bold uppercase tracking-[0.18em] text-[#0b5d42]'
                      : 'text-[13px] font-bold uppercase tracking-[0.18em] text-[#a3781f]'
                  }
                >
                  {a.title}
                </h2>
              )}
              <p className="mt-1 whitespace-pre-line font-display text-[17px] leading-relaxed text-[#33453a]">
                {a.text}
              </p>
            </div>
            <button
              onClick={() => del.mutate(a.id)}
              aria-label="Supprimer l'annonce"
              className="rounded-full p-1.5 text-[#b6b1a0] opacity-0 transition-all hover:bg-black/5 hover:text-[#b3452f] focus-visible:opacity-100 group-hover:opacity-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </motion.article>
      ))}
    </section>
  )
}
