'use client'

import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { useContent } from '@/lib/api'
import type { ContentItem } from '@/lib/types'
import { SectionShell } from './ijtima-section'

/* ═══════════════ Section ADHKÂR — seule section de contenu conservée ═══════════════ */

function CarteContenu({ item, index }: { item: ContentItem; index: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -3 }}
      className="group relative overflow-hidden rounded-2xl border border-primary/12 bg-card p-4 shadow-sm transition-all duration-300 hover:border-primary/25 hover:shadow-lg"
    >
      {/* Liseré doré discret qui s'illumine au survol */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-gradient-to-r from-gold/50 via-accent/40 to-transparent transition-transform duration-500 group-hover:scale-x-100"
      />
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-background text-xl ring-1 ring-primary/10 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/6">
          {item.icon || '✦'}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-semibold text-encre">{item.title}</h3>
          {item.subtitle && (
            <p className="text-xs italic text-muted-foreground">{item.subtitle}</p>
          )}
          {item.time && (
            <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-sand px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
              {item.time}
            </p>
          )}
          {item.body && (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
          )}
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 rounded-full py-0.5 pr-2 text-xs font-semibold text-primary underline-offset-4 transition-colors hover:text-gold-vif hover:underline"
            >
              <span
                aria-hidden
                className="grid h-5 w-5 place-items-center rounded-full bg-primary/10 text-[8px] transition-all duration-300 group-hover:translate-x-0.5 group-hover:bg-primary group-hover:text-white"
              >
                ▶
              </span>
              Écouter
            </a>
          )}
        </div>
      </div>
    </motion.article>
  )
}

export function ContentSections() {
  const { data, isLoading } = useContent('ADHKAR')

  return (
    <SectionShell
      titre="Adhkâr"
      compteur={data ? `${data.length}` : undefined}
      defaultOpen
      id="adhkar"
    >
      {isLoading ? (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-sand/60" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {(data ?? []).map((item, i) => (
            <CarteContenu key={item.id} item={item} index={i} />
          ))}
          {!data?.length && (
            <p className="rounded-2xl border border-dashed border-primary/20 p-6 text-center text-sm text-brouillard sm:col-span-2">
              <Sparkles className="mx-auto mb-2 h-5 w-5 text-gold" />
              Rien pour le moment ✦
            </p>
          )}
        </div>
      )}
    </SectionShell>
  )
}
