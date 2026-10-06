'use client'

import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Lock, LockOpen, Pencil, Plus, Trash2, Users, Vote } from 'lucide-react'
import {
  useCreatePoll,
  useDeletePoll,
  usePolls,
  useUpdatePoll,
  useVote,
} from '@/lib/api'
import { useUser } from '@/lib/store'
import { peut } from '@/lib/permissions'
import { parsePollOptions, type Poll, type PollVote } from '@/lib/types'
import { dateCourte } from '@/lib/format'
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
 *  évite que des votes ne comptent pas face à l'option écrite autrement. */
function normChoix(s: string): string {
  return s.replace(/[\u2018\u2019']/g, "'")
}

/** Une réponse est une « venue » quand elle dit qu'on vient —
 *  c'est elle, et elle seule, qui ouvre la question « seul ou accompagné ? » */
function estVenue(opt: string): boolean {
  const t = normChoix(opt).toLowerCase()
  if (/\b(pas|non|ne viens|absent|excus)\b/.test(t)) return false
  return /\b(viens|vient|présent|present|serai|là|la)\b/.test(t)
}

/** « 1 » seul, « +N » accompagné — la mention lisible du vote */
function mentionPersonnes(n: number): string {
  return n <= 1 ? 'seul' : `+${n - 1}`
}

function CarteSondage({ poll }: { poll: Poll }) {
  const options = useMemo(() => parsePollOptions(poll), [poll])
  const vote = useVote()
  const del = useDeletePoll()
  const maj = useUpdatePoll()
  const memberId = useUser((s) => s.memberId)
  const ville = useUser((s) => s.ville)
  const role = useUser((s) => s.role)
  const perms = useUser((s) => s.perms)
  /* Les sondages de la zawiya — seuls les frères de Nîmes les créent */
  const peutGerer = peut(ville, role, 'sondages.creer', perms)
  const [editionOuverte, setEditionOuverte] = useState(false)

  const monVote = poll.votes.find((v) => v.memberId === memberId) ?? null
  const monVoteNormalise = monVote?.choice ? normChoix(monVote.choice) : null
  const totalVotes = poll.votes.length
  const ferme = poll.closesAt && new Date(poll.closesAt) < new Date()

  const compteur = (opt: string) =>
    poll.votes.filter((v) => normChoix(v.choice) === normChoix(opt)).length

  /** Les personnes promises sur une réponse « venue » :
      chaque votant compte pour lui-même et ses accompagnants. */
  const personnesSur = (opt: string) =>
    poll.votes
      .filter((v) => normChoix(v.choice) === normChoix(opt))
      .reduce((s, v) => s + (v.personnes > 0 ? v.personnes : 1), 0)

  /** Les personnes promises sur les réponses « venue » : les votes
      hérités (avant la mention) comptent pour une personne. */
  const totalPersonnes = poll.votes
    .filter((v) => options.some((o) => estVenue(o) && normChoix(o) === normChoix(v.choice)))
    .reduce((s, v) => s + (v.personnes > 0 ? v.personnes : 1), 0)

  /* L'option qui mène — marquée d'une étoile d'or */
  const maxVoix = Math.max(0, ...options.map(compteur))
  const leader =
    totalVotes > 0 && maxVoix > 0 ? options.find((o) => compteur(o) === maxVoix) ?? null : null

  /* Voter : la venue emmène sa question « seul ou accompagné »,
     le clic sur une réponse déjà portée (même effectif) retire le vote. */
  const voter = (opt: string, personnes?: number) => {
    if (!memberId || ferme) return
    if (!estVenue(opt)) {
      vote.mutate({ pollId: poll.id, memberId, choice: opt, personnes: 0 })
      return
    }
    if (personnes !== undefined) {
      /* Un jeton déjà actif ne re-clique rien : on ne retire pas
         un vote en voulant le confirmer. */
      if (monVoteNormalise === normChoix(opt) && (monVote?.personnes ?? 0) === personnes) return
      vote.mutate({ pollId: poll.id, memberId, choice: opt, personnes })
      return
    }
    if (monVoteNormalise === normChoix(opt)) {
      /* Même réponse, même effectif : l'API y reconnaît un retrait */
      vote.mutate({
        pollId: poll.id,
        memberId,
        choice: opt,
        personnes: monVote?.personnes ?? 1,
      })
    } else {
      vote.mutate({ pollId: poll.id, memberId, choice: opt, personnes: 1 })
    }
  }

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'relative rounded-2xl border bg-card p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-8px_rgba(11,93,66,0.2)]',
        ferme ? 'border-brouillard-clair/30 opacity-80' : 'border-primary/12'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold leading-snug text-encre">
            {poll.question}
          </h3>
          <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-brouillard">
            <span>{dateCourte(poll.createdAt)}</span>
            {poll.meeting && <span>· {poll.meeting.title}</span>}
            {ferme && (
              <span className="inline-flex items-center gap-1 rounded-full bg-sand px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <Lock className="h-3 w-3" /> fermé
              </span>
            )}
          </p>
        </div>
        {peutGerer && (
          <div className="flex shrink-0 items-center gap-0.5">
            <button
              onClick={() => setEditionOuverte(true)}
              aria-label="Modifier le sondage"
              title="Modifier le sondage"
              className="rounded-full p-2 text-brouillard-clair transition-colors hover:bg-gold/10 hover:text-gold"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => del.mutate(poll.id)}
              aria-label="Supprimer le sondage"
              className="rounded-full p-2 text-brouillard-clair transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Options */}
      <div className="mt-3 space-y-2">
        {options.map((opt) => {
          const n = compteur(opt)
          const pct = totalVotes ? Math.round((n / totalVotes) * 100) : 0
          const estMonVote = monVoteNormalise === normChoix(opt)
          const venue = estVenue(opt)
          const pers = personnesSur(opt)
          return (
            <div key={opt}>
              <button
                onClick={() => voter(opt)}
                disabled={!memberId || !!ferme}
                className={cn(
                  'relative w-full overflow-hidden rounded-xl border px-4 py-2.5 text-left text-sm font-medium transition-all',
                  estMonVote
                    ? 'border-primary/50 bg-primary/5 text-primary'
                    : 'border-primary/15 bg-card text-secondary-foreground hover:border-primary/40'
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
                    estMonVote ? 'bg-primary/12' : 'bg-accent/12'
                  )}
                />
                <span className="relative flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    {estMonVote && <Check className="h-3.5 w-3.5" />}
                    {opt}
                    {opt === leader && (
                      <span
                        title="Option qui mène"
                        className="text-[10px] text-gold"
                        aria-label="Option qui mène"
                      >
                        ✦
                      </span>
                    )}
                  </span>
                  <span className="flex items-baseline gap-1.5 text-xs font-bold tabular-nums text-muted-foreground">
                    <span>{n}</span>
                    {venue && n > 0 && (
                      <span className="text-[10.5px] font-semibold text-primary/70">
                        · {pers} pers.
                      </span>
                    )}
                    <span className="text-brouillard-clair">· {pct}%</span>
                  </span>
                </span>
              </button>

              {/* Seul ou accompagné — la mention propre à la venue */}
              {venue && estMonVote && !ferme && (
                <div className="mt-1.5 pl-1">
                  <p className="mb-1 pl-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-brouillard">
                    Tu viens seul ou accompagné ?
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {[1, 2, 3, 4, 5].map((nb) => {
                      const actif = (monVote?.personnes ?? 0) === nb
                      return (
                        <button
                          key={nb}
                          type="button"
                          onClick={() => voter(opt, nb)}
                          disabled={!memberId}
                          aria-pressed={actif}
                          className={cn(
                            'rounded-full px-3 py-1 text-[11.5px] font-semibold transition-all active:scale-95',
                            actif
                              ? 'bg-primary text-white shadow-sm shadow-primary/25'
                              : 'bg-primary/6 text-primary ring-1 ring-primary/20 hover:bg-primary/12'
                          )}
                        >
                          {nb === 1 ? 'Seul' : `${nb} pers.`}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

            </div>
          )
        })}
      </div>

      {/* Pied */}
      <div className="mt-3 flex items-center justify-between gap-2 text-xs">
        <span className="inline-flex shrink-0 items-center gap-1.5 text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          {totalVotes} vote{totalVotes > 1 ? 's' : ''}
          {totalPersonnes > 0 && (
            <span className="font-semibold text-primary">· {totalPersonnes} personnes</span>
          )}
        </span>
        <div className="flex items-center gap-1.5">
          {monVote && (
            <span className="hidden rounded-full bg-primary/8 px-2.5 py-1 font-semibold text-primary sm:inline">
              ton vote : {monVote.choice}
              {estVenue(monVote.choice) && ` (${mentionPersonnes(monVote.personnes || 1)})`}
            </span>
          )}
          <button
            onClick={() =>
              maj.mutate({ id: poll.id, closesAt: ferme ? null : new Date().toISOString() })
            }
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-semibold text-muted-foreground transition-colors hover:bg-sand hover:text-primary"
          >
            {ferme ? <LockOpen className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
            {ferme ? 'rouvrir' : 'fermer'}
          </button>
        </div>
      </div>

      {/* Dialogue de modification — remonté à chaque ouverture pour préremplir */}
      {editionOuverte && (
        <NouveauSondageDialog
          open={editionOuverte}
          onOpenChange={setEditionOuverte}
          poll={poll}
        />
      )}
    </motion.article>
  )
}

/* ═══════════════ Les sondages — intégrés à la section Al-Ijtimâ' ═══════════════ */
export function SondagesDuIjtima() {
  const { data: polls, isLoading } = usePolls()
  const ville = useUser((s) => s.ville)
  const role = useUser((s) => s.role)
  const perms = useUser((s) => s.perms)
  const peutCreer = peut(ville, role, 'sondages.creer', perms)
  const [ouvert, setOuvert] = useState(false)

  return (
    <div className="mt-5">
      {/* Sous-titre de groupe — dans la coquille Al-Ijtimâ' */}
      <div className="mb-2 flex items-center justify-between">
        <h3 className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-brouillard">
          <Vote className="h-3.5 w-3.5 text-gold" aria-hidden /> Sondages
        </h3>
        {polls && polls.length > 0 && (
          <span className="rounded-full bg-sand px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
            {polls.length}
          </span>
        )}
      </div>
      {isLoading ? (
        <div className="h-32 animate-pulse rounded-2xl bg-sand/60" />
      ) : (
        <div className="space-y-3">
          {(polls ?? []).map((p) => (
            <CarteSondage key={p.id} poll={p} />
          ))}
          {!polls?.length && (
            <p className="rounded-2xl border border-dashed border-primary/20 p-4 text-center text-xs text-brouillard">
              Aucun sondage pour l'instant.
            </p>
          )}
          {peutCreer && (
            <button
              onClick={() => setOuvert(true)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-gold/45 bg-or-pale/40 p-3 text-xs font-bold uppercase tracking-[0.18em] text-gold-vif transition-colors hover:border-gold/70 hover:bg-or-pale/70"
            >
              <Plus className="h-4 w-4" /> Nouveau sondage
            </button>
          )}
        </div>
      )}
      <NouveauSondageDialog open={ouvert} onOpenChange={setOuvert} />
    </div>
  )
}

/* ═══════════════ Dialogue de création / modification ═══════════════ */
function NouveauSondageDialog({
  open,
  onOpenChange,
  poll,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  poll?: Poll // présent = mode modification
}) {
  const create = useCreatePoll()
  const maj = useUpdatePoll()
  const memberId = useUser((s) => s.memberId)
  const { toast } = useToast()

  const edition = !!poll

  const [question, setQuestion] = useState(poll?.question ?? '')
  const [options, setOptions] = useState(
    poll ? parsePollOptions(poll).join('\n') : 'Je viens\nJe ne viens pas'
  )

  /* Votes existants qui ne correspondront plus à aucune réponse */
  const votesPerdus = useMemo(() => {
    if (!poll) return 0
    const nouvelles = options
      .split('\n')
      .map((o) => normChoix(o.trim()))
      .filter(Boolean)
    return poll.votes.filter((v) => !nouvelles.includes(normChoix(v.choice))).length
  }, [poll, options])

  const publier = () => {
    if (!question.trim()) {
      toast({ title: 'Question requise', variant: 'destructive' })
      return
    }
    const opts = options
      .split('\n')
      .map((o) => o.trim())
      .filter(Boolean)
    if (opts.length < 2) {
      toast({ title: 'Au moins deux réponses', variant: 'destructive' })
      return
    }
    if (edition && poll) {
      maj.mutate(
        { id: poll.id, question: question.trim(), options: opts },
        {
          onSuccess: () => {
            toast({ title: 'Sondage mis à jour' })
            onOpenChange(false)
          },
        }
      )
    } else {
      create.mutate(
        { question: question.trim(), options: opts, createdBy: memberId },
        {
          onSuccess: () => {
            toast({ title: 'Sondage créé' })
            setQuestion('')
            setOptions('Je viens\nJe ne viens pas')
            onOpenChange(false)
          },
        }
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl border-primary/15 bg-ivoire">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-2xl text-encre">
            {edition ? (
              <>
                <Pencil className="h-5 w-5 text-gold" /> Modifier le sondage
              </>
            ) : (
              <>
                <Vote className="h-5 w-5 text-primary" /> Nouveau sondage
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {edition
              ? 'Ajuste la question ou les réponses — les votes sur des réponses supprimées seront perdus.'
              : 'Pose la question à la communauté — chacun vote avec son prénom.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Question
            </Label>
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Qui vient samedi pour la Sadaqa ?"
              className="rounded-xl border-primary/25 bg-card"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Réponses (une par ligne)
            </Label>
            <Textarea
              value={options}
              onChange={(e) => setOptions(e.target.value)}
              rows={4}
              className="rounded-xl border-primary/25 bg-card"
            />
            <p className="text-[10.5px] leading-relaxed text-brouillard">
              Une réponse qui dit qu'on vient ouvre la question « seul ou accompagné ? »
              (1 à 5 personnes).
            </p>
            {edition && votesPerdus > 0 && (
              <p className="rounded-lg bg-corail-pale px-3 py-2 text-xs font-medium text-destructive">
                ⚠︎ {votesPerdus} vote{votesPerdus > 1 ? 's' : ''} ne correspond
                {votesPerdus > 1 ? 'ent' : ''} plus à une réponse — il
                {votesPerdus > 1 ? 's' : ''} sera{votesPerdus > 1 ? 'ont' : ''} supprimé
                {votesPerdus > 1 ? 's' : ''}.
              </p>
            )}
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-full text-muted-foreground">
            Annuler
          </Button>
          <Button
            onClick={publier}
            disabled={create.isPending || maj.isPending}
            className="rounded-full bg-primary px-8 text-white hover:bg-emerald-deep"
          >
            {create.isPending || maj.isPending
              ? 'Enregistrement…'
              : edition
                ? 'Enregistrer'
                : 'Créer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
