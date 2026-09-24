'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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
  return fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meetings'] })
      qc.invalidateQueries({ queryKey: ['polls'] })
    },
  })
}

export function useDeleteMeeting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api(`/api/meetings/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meetings'] }),
  })
}

/* ─── Présences ─── */
export function useToggleAttendance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { meetingId: string; memberId: string; guests?: number }) =>
      api('/api/attendance', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meetings'] }),
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contributions'] }),
  })
}

export function useUpdateContribution() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Record<string, unknown>) =>
      api<Contribution>(`/api/contributions/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contributions'] }),
  })
}

export function useDeleteContribution() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api(`/api/contributions/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contributions'] }),
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ['polls'] }),
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ['polls'] }),
  })
}

export function useDeletePoll() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api(`/api/polls/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['polls'] }),
  })
}

/* ─── Contenus ─── */
export function useContent(section: string) {
  return useQuery({
    queryKey: ['content', section],
    queryFn: () => api<ContentItem[]>(`/api/content?section=${section}`),
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  })
}

/* ─── Annonces ─── */
export function useCreateAnnouncement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { title?: string; text: string; color?: string }) =>
      api<Announcement>('/api/announcements', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['announcements'] }),
  })
}
