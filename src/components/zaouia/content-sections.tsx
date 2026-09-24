'use client'

import { motion } from 'framer-motion'
import { BookOpen, Headphones, GraduationCap, Sparkles } from 'lucide-react'
import { useContent } from '@/lib/api'
import type { ContentItem } from '@/lib/types'
import { SectionShell } from './ijtima-section'

const SECTIONS: {
  key: ContentItem['section']
  titre: string
  icone: React.ElementType
  defaut: string
}[] = [
  { key: 'ADHKAR', titre: 'Adhkâr', icone: Sparkles, defaut: '✦' },
  { key: 'QURAN', titre: 'Qur\u2019ân', icone: BookOpen, defaut: '📖' },
  { key: 'SAMA', titre: 'Samâ\u2018', icone: Headphones, defaut: '🎵' },
  { key: 'DURUS', titre: 'Durûs', icone: GraduationCap, defaut: '🗣️' },
]

function CarteContenu({ item, index }: { item: ContentItem; index: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group rounded-2xl border border-[#0b5d42]/12 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#fbf9f4] text-xl ring-1 ring-[#0b5d42]/10">
          {item.icon || '✦'}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-semibold text-[#123c2d]">{item.title}</h3>
          {item.subtitle && (
            <p className="text-xs italic text-[#78877d]">{item.subtitle}</p>
          )}
          {item.time && (
            <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-[#efe9dc] px-2.5 py-0.5 text-[11px] font-semibold text-[#78877d]">
              {item.time}
            </p>
          )}
          {item.body && (
            <p className="mt-2 text-sm leading-relaxed text-[#5b6b60]">{item.body}</p>
          )}
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#0b5d42] underline-offset-4 hover:underline"
            >
              ▶ Écouter
            </a>
          )}
        </div>
      </div>
    </motion.article>
  )
}

export function ContentSections() {
  return (
    <>
      {SECTIONS.map((s) => (
        <ContentSection key={s.key} sectionKey={s.key} titre={s.titre} icone={s.icone} defaut={s.defaut} />
      ))}
    </>
  )
}

function ContentSection({
  sectionKey,
  titre,
  icone: Icone,
  defaut,
}: {
  sectionKey: ContentItem['section']
  titre: string
  icone: React.ElementType
  defaut: string
}) {
  const { data, isLoading } = useContent(sectionKey)

  return (
    <SectionShell titre={titre} compteur={data ? `${data.length}` : undefined}>
      {isLoading ? (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-[#efe9dc]/60" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {(data ?? []).map((item, i) => (
            <CarteContenu key={item.id} item={item} index={i} />
          ))}
          {!data?.length && (
            <p className="rounded-2xl border border-dashed border-[#0b5d42]/20 p-6 text-center text-sm text-[#a09a87] sm:col-span-2">
              <Icone className="mx-auto mb-2 h-5 w-5 text-[#b8923a]" />
              Rien pour le moment {defaut}
            </p>
          )}
        </div>
      )}
    </SectionShell>
  )
}
