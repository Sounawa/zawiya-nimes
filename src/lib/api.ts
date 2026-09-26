'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useUser } from './store'
import type {
  AppSettings,
  Announcement,
  Contribution,
  ContributionTotals,
  ContentItem,
  Meeting,
  Member,
  Poll,
} from './types'

export function api<T>(url: string, init?: RequestInit): Promise<T> {
  let body = init?.body
  /* Le prénom courant est injecté comme « actor » dans les corps JSON —
     le journal de la zawiya sait ainsi qui a fait quoi. */
  if (typeof body === 'string') {
    try {
      const parsed = JSON.parse(body)
      if (parsed && typeof parsed === 'object' && !('actor' in parsed)) {
        const acteur = useUser.getState().name
        if (acteur) (parsed as Record<string, unknown>).actor = acteur
        body = JSON.stringify(parsed)
      }
    } catch {
      /* corps non JSON — inchangé */
    }
  }
  return fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json' },
    body,
  }).then((r) => {
    if (!r.ok) throw new Error('Erreur réseau')
    return r.json()
  })
}

/* ─── Membres ─── */
export function useMembers() {
  return useQuery({
    queryKey: ['members'],
    queryFn: () => api<Member[]>('/api/members'),
  })
}

/* ─── Réunions ─── */
export function useMeetings() {
  return useQuery({
    queryKey: ['meetings'],
    queryFn: () => api<Meeting[]>('/api/meetings'),
  })
}

export function useCreateMeeting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api<Meeting>('/api/meetings', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: (cree) => {
      if (cree?.id) creationsLocales.reunions.add(cree.id)
      qc.invalidateQueries({ queryKey: ['meetings'] })
      qc.invalidateQueries({ queryKey: ['polls'] })
      qc.invalidateQueries({ queryKey: ['audit'] })
    },
  })
}

export function useUpdateMeeting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Record<string, unknown>) =>
      api<Meeting>(`/api/meetings/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meetings'] })
      qc.invalidateQueries({ queryKey: ['polls'] })
      qc.invalidateQueries({ queryKey: ['audit'] })
    },
  })
}

export function useDeleteMeeting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api(`/api/meetings/${id}`, { method: 'DELETE', body: JSON.stringify({}) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meetings'] })
      qc.invalidateQueries({ queryKey: ['audit'] })
    },
  })
}

/* ─── Présences ─── */
export function useToggleAttendance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { meetingId: string; memberId: string; guests?: number }) =>
      api('/api/attendance', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meetings'] })
      qc.invalidateQueries({ queryKey: ['audit'] })
    },
  })
}

/* ─── Contributions ─── */
export function useContributions() {
  return useQuery({
    queryKey: ['contributions'],
    queryFn: () =>
      api<{ contributions: Contribution[]; totals: ContributionTotals }>('/api/contributions'),
  })
}

export function useCreateContribution() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api<Contribution>('/api/contributions', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contributions'] })
      qc.invalidateQueries({ queryKey: ['audit'] })
    },
  })
}

export function useUpdateContribution() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Record<string, unknown>) =>
      api<Contribution>(`/api/contributions/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contributions'] })
      qc.invalidateQueries({ queryKey: ['audit'] })
    },
  })
}

export function useDeleteContribution() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api(`/api/contributions/${id}`, { method: 'DELETE', body: JSON.stringify({}) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contributions'] })
      qc.invalidateQueries({ queryKey: ['audit'] })
    },
  })
}

/* ─── Sondages ─── */
export function usePolls() {
  return useQuery({
    queryKey: ['polls'],
    queryFn: () => api<Poll[]>('/api/polls'),
  })
}

export function useCreatePoll() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api<Poll>('/api/polls', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['polls'] })
      qc.invalidateQueries({ queryKey: ['audit'] })
    },
  })
}

export function useVote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { pollId: string; memberId: string; choice: string }) =>
      api(`/api/polls/${data.pollId}/vote`, {
        method: 'POST',
        body: JSON.stringify({ memberId: data.memberId, choice: data.choice }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['polls'] })
      qc.invalidateQueries({ queryKey: ['audit'] })
    },
  })
}

export function useUpdatePoll() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Record<string, unknown>) =>
      api<Poll>(`/api/polls/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['polls'] })
      qc.invalidateQueries({ queryKey: ['audit'] })
    },
  })
}

export function useDeletePoll() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api(`/api/polls/${id}`, { method: 'DELETE', body: JSON.stringify({}) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['polls'] })
      qc.invalidateQueries({ queryKey: ['audit'] })
    },
  })
}

/* ─── Contenus ─── */
export function useContent(section: string) {
  return useQuery({
    queryKey: ['content', section],
    queryFn: () => api<ContentItem[]>(`/api/content?section=${section}`),
  })
}

export function useCreateContent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api<ContentItem>('/api/content', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['content'] })
      qc.invalidateQueries({ queryKey: ['audit'] })
    },
  })
}

export function useUpdateContent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Record<string, unknown>) =>
      api<ContentItem>(`/api/content/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['content'] })
      qc.invalidateQueries({ queryKey: ['audit'] })
    },
  })
}

export function useDeleteContent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      api(`/api/content/${id}`, { method: 'DELETE', body: JSON.stringify({}) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['content'] })
      qc.invalidateQueries({ queryKey: ['audit'] })
    },
  })
}

/** Échange l'ordre de deux entrées (montée/descente) — deux PATCH successifs */
export function useReorderContent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (paire: { id: string; order: number }[]) => {
      for (const p of paire) {
        await api(`/api/content/${p.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ order: p.order }),
        })
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['content'] })
    },
  })
}

/* ─── Réglages ─── */
export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: () => api<AppSettings>('/api/settings'),
  })
}

export function useSaveSetting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { key: string; value: unknown }) =>
      api('/api/settings', { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] })
      qc.invalidateQueries({ queryKey: ['audit'] })
    },
  })
}

/* ─── Journal de la zawiya ─── */
export function useAudit() {
  return useQuery({
    queryKey: ['audit'],
    queryFn: () => api<import('./types').AuditEntry[]>('/api/audit'),
  })
}

/* ─── Annonces ─── */
export function useAnnouncements() {
  return useQuery({
    queryKey: ['announcements'],
    queryFn: () => api<Announcement[]>('/api/announcements'),
  })
}

/* IDs créés localement (cet onglet) — la veille ne les annonce pas en toast */
export const creationsLocales = {
  annonces: new Set<string>(),
  reunions: new Set<string>(),
}

export function useCreateAnnouncement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { title?: string; text: string; color?: string }) =>
      api<Announcement>('/api/announcements', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: (cree) => {
      if (cree?.id) creationsLocales.annonces.add(cree.id)
      qc.invalidateQueries({ queryKey: ['announcements'] })
      qc.invalidateQueries({ queryKey: ['audit'] })
    },
  })
}

export function useUpdateAnnouncement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; title?: string; text: string; color?: string }) =>
      api<Announcement>(`/api/announcements/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['announcements'] })
      qc.invalidateQueries({ queryKey: ['audit'] })
    },
  })
}
