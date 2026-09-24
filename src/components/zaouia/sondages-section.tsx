'use client'

import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BarChart3, Check, Plus, Trash2, Users, Vote } from 'lucide-react'
import {
  useCreatePoll,
  useDeletePoll,
  useMembers,
  usePolls,
  useVote,
} from '@/lib/api'
import { useUser } from '@/lib/store'
import { parsePollOptions, type Poll } from '@/lib/types'
import { dateCourte } from '@/lib/format'
import { SectionShell } from './ijtima-section'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

/* ═══════════════ Un sondage ═══════════════ */

/** Normalise les apostrophes typographiques (’ U+2019) en apostrophes droites —
 *  évite que des votes « Inch’Allah » ne comptent pas face à l’option « Inch'Allah ». */
function normChoix(s: string): string {
  return s.replace(/[\u2018\u2019']/g, "'")
}

function CarteSondage({ poll }: { poll: Poll }) {
  const options = useMemo(() => parsePollOptions(poll), [poll])
  const membres = useMembers().data
  const vote = useVote()
  const del = useDeletePoll()
  const memberId = useUser((s) => s.memberId)
  const [voirVotants, setVoirVotants] = useState<string | null>(null)

  const monVote = poll.votes.find((v) => v.memberId === memberId)?.choice
  const monVoteNormalise = monVote ? normChoix(monVote) : null
  const totalVotes = poll.votes.length
  const ferme = poll.closesAt && new Date(poll.closesAt) < new Date()

  const compteur = (opt: string) =>
    poll.votes.filter((v) => normChoix(v.choice) === normChoix(opt)).length

  const voter = (opt: string) => {
    if (!memberId || ferme) return
    vote.mutate({ pollId: poll.id, memberId, choice: opt })
  }

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-[#0b5d42]/12 bg-white p-4 shadow-sm"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold leading-snug text-[#123c2d]">
            {poll.question}
          </h3>
          <p className="mt-0.5 text-xs text-[#a09a87]">
            {dateCourte(poll.createdAt)}
            {poll.meeting && ` · ${poll.meeting.title}`}
            {ferme && ' · fermé'}
          </p>
        </div>
        <button
          onClick={() => del.mutate(poll.id)}
          aria-label="Supprimer le sondage"
          className="rounded-full p-1.5 text-[#b6b1a0] transition-colors hover:bg-[#b3452f]/10 hover:text-[#b3452f]"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Options */}
      <div className="mt-3 space-y-2">
        {options.map((opt) => {
          const n = compteur(opt)
          const pct = totalVotes ? Math.round((n / totalVotes) * 100) : 0
          const estMonVote = monVoteNormalise === normChoix(opt)
          return (
            <div key={opt}>
              <button
                onClick={() => voter(opt)}
                disabled={!memberId || !!ferme}
                className={cn(
                  'relative w-full overflow-hidden rounded-xl border px-4 py-2.5 text-left text-sm font-medium transition-all',
                  estMonVote
                    ? 'border-[#0b5d42]/50 bg-[#0b5d42]/5 text-[#0b5d42]'
                    : 'border-[#0b5d42]/15 bg-white text-[#33453a] hover:border-[#0b5d42]/40'
                )}
              >
                {/* Barre de résultat */}
                <motion.span
                  aria-hidden
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className={cn(
                    'absolute inset-y-0 left-0',
                    estMonVote ? 'bg-[#0b5d42]/12' : 'bg-[#c9a24b]/12'
                  )}
                />
                <span className="relative flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    {estMonVote && <Check className="h-3.5 w-3.5" />}
                    {opt}
                  </span>
                  <span className="text-xs font-bold tabular-nums text-[#78877d]">
                    {n} <span className="text-[#b6b1a0]">· {pct}%</span>
                  </span>
                </span>
              </button>

              {/* Votants */}
              <AnimatePresence>
                {voirVotants === opt && (
                  <motion.ul
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden pl-4 pt-1"
                  >
                    {poll.votes
                      .filter((v) => normChoix(v.choice) === normChoix(opt))
                      .map((v) => (
                        <li key={v.id} className="py-0.5 text-xs text-[#78877d]">
                          Sidi {v.member.name}
                        </li>
                      ))}
                    {n === 0 && <li className="py-0.5 text-xs text-[#b6b1a0]">Personne…</li>}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>

      {/* Pied */}
      <div className="mt-3 flex items-center justify-between text-xs">
        <button
          onClick={() => setVoirVotants((v) => (v ? null : ''))}
          className="inline-flex items-center gap-1.5 text-[#78877d] transition-colors hover:text-[#0b5d42]"
        >
          <Users className="h-3.5 w-3.5" />
          {totalVotes} vote{totalVotes > 1 ? 's' : ''}
          <span className="text-[#b6b1a0]">· voir qui</span>
        </button>
        {monVote && (
          <span className="rounded-full bg-[#0b5d42]/8 px-2.5 py-1 font-semibold text-[#0b5d42]">
            ton vote : {monVote}
          </span>
        )}
      </div>
    </motion.article>
  )
}

/* ═══════════════ Section Sondages ═══════════════ */
export function SondagesSection() {
  const { data: polls, isLoading } = usePolls()
  const [ouvert, setOuvert] = useState(false)

  return (
    <>
      <SectionShell
        titre="Sondages"
        compteur={polls ? `${polls.length}` : undefined}
        id="sondages"
      >
        {isLoading ? (
          <div className="h-32 animate-pulse rounded-2xl bg-[#efe9dc]/60" />
        ) : (
          <div className="space-y-3">
            {(polls ?? []).map((p) => (
              <CarteSondage key={p.id} poll={p} />
            ))}
            <button
              onClick={() => setOuvert(true)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[#0b5d42]/30 bg-white/50 p-4 text-sm font-semibold text-[#0b5d42] transition-colors hover:bg-[#0b5d42]/5"
            >
              <Plus className="h-4 w-4" /> Nouveau sondage — « qui vient ? »
            </button>
          </div>
        )}
      </SectionShell>
      <NouveauSondageDialog open={ouvert} onOpenChange={setOuvert} />
    </>
  )
}

/* ═══════════════ Dialogue de création ═══════════════ */
function NouveauSondageDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const create = useCreatePoll()
  const memberId = useUser((s) => s.memberId)
  const { toast } = useToast()

  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState("Je viens\nJe ne viens pas\nInch'Allah")

  const publier = () => {
    if (!question.trim()) {
      toast({ title: 'Question requise', variant: 'destructive' })
      return
    }
    const opts = options
      .split('\n')
      .map((o) => o.trim())
      .filter(Boolean)
    create.mutate(
      { question: question.trim(), options: opts, createdBy: memberId },
      {
        onSuccess: () => {
          toast({ title: 'Sondage créé' })
          setQuestion('')
          setOptions("Je viens\nJe ne viens pas\nInch'Allah")
          onOpenChange(false)
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl border-[#0b5d42]/15 bg-[#fdfcf8]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-2xl text-[#123c2d]">
            <Vote className="h-5 w-5 text-[#0b5d42]" /> Nouveau sondage
          </DialogTitle>
          <DialogDescription>
            Pose la question à la communauté — chacun vote avec son prénom.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#78877d]">
              Question
            </Label>
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Qui vient à l'ijtima' de samedi ?"
              className="rounded-xl border-[#0b5d42]/25 bg-white"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#78877d]">
              Réponses (une par ligne)
            </Label>
            <Textarea
              value={options}
              onChange={(e) => setOptions(e.target.value)}
              rows={4}
              className="rounded-xl border-[#0b5d42]/25 bg-white"
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-full text-[#78877d]">
            Annuler
          </Button>
          <Button
            onClick={publier}
            disabled={create.isPending}
            className="rounded-full bg-[#0b5d42] px-8 text-white hover:bg-[#0b3d2e]"
          >
            {create.isPending ? 'Création…' : 'Créer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
