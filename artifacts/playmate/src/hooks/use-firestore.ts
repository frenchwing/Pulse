import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as fs from "@/lib/firestore";

type MutationOptions<T = any> = { mutation?: { onSuccess?: (data: T) => void; onError?: (err: any) => void } };

// ── Query keys ────────────────────────────────────────────────────────────────
export const activitiesKey = () => ["activities"] as const;
export const activityKey = (id: string) => ["activity", id] as const;
export const eventsKey = () => ["events"] as const;
export const eventKey = (id: string) => ["event", id] as const;
export const profileKey = (id: string) => ["profile", id] as const;

// ── Activities ────────────────────────────────────────────────────────────────

export function useListActivities(filters?: Record<string, string>) {
  return useQuery({ queryKey: activitiesKey(), queryFn: () => fs.listActivities(filters) });
}

export function useGetActivity(id: string) {
  return useQuery({ queryKey: activityKey(id), queryFn: () => fs.getActivity(id), enabled: !!id });
}

export function useCreateActivity(options?: MutationOptions) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ data }: { data: any }) => fs.createActivity(data),
    onSuccess: (data) => { qc.invalidateQueries({ queryKey: activitiesKey() }); options?.mutation?.onSuccess?.(data); },
    onError: options?.mutation?.onError,
  });
}

export function useJoinActivity(options?: MutationOptions) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string; data?: any }) => fs.joinActivity(id),
    onSuccess: (data) => { qc.invalidateQueries({ queryKey: activitiesKey() }); options?.mutation?.onSuccess?.(data); },
    onError: options?.mutation?.onError,
  });
}

export function useGetActivityRatings(id: string) {
  return useQuery({ queryKey: ["activityRatings", id], queryFn: () => fs.getActivityRatings(id), enabled: !!id });
}

export function useRateActivityPlayer(options?: MutationOptions) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => fs.rateActivityPlayer(id, data),
    onSuccess: (data, vars) => { qc.invalidateQueries({ queryKey: ["activityRatings", vars.id] }); options?.mutation?.onSuccess?.(data); },
    onError: options?.mutation?.onError,
  });
}

// ── Events ────────────────────────────────────────────────────────────────────

export function useListEvents(filters?: Record<string, string>) {
  return useQuery({ queryKey: eventsKey(), queryFn: () => fs.listEvents(filters) });
}

export function useGetEvent(id: string) {
  return useQuery({ queryKey: eventKey(id), queryFn: () => fs.getEvent(id), enabled: !!id });
}

export function useCreateEvent(options?: MutationOptions) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ data }: { data: any }) => fs.createEvent(data),
    onSuccess: (data) => { qc.invalidateQueries({ queryKey: eventsKey() }); options?.mutation?.onSuccess?.(data); },
    onError: options?.mutation?.onError,
  });
}

export function useJoinEvent(options?: MutationOptions) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string; data?: any }) => fs.joinEvent(id),
    onSuccess: (data) => { qc.invalidateQueries({ queryKey: eventsKey() }); options?.mutation?.onSuccess?.(data); },
    onError: options?.mutation?.onError,
  });
}

export function useGetEventRatings(id: string) {
  return useQuery({ queryKey: ["eventRatings", id], queryFn: () => fs.getEventRatings(id), enabled: !!id });
}

export function useRateEventPlayer(options?: MutationOptions) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => fs.rateEventPlayer(id, data),
    onSuccess: (data, vars) => { qc.invalidateQueries({ queryKey: ["eventRatings", vars.id] }); options?.mutation?.onSuccess?.(data); },
    onError: options?.mutation?.onError,
  });
}

// ── Profiles ──────────────────────────────────────────────────────────────────

export function useGetProfile(id: string) {
  return useQuery({ queryKey: profileKey(id), queryFn: () => fs.getProfile(id), enabled: !!id });
}

export function useListProfiles() {
  return useQuery({ queryKey: ["profiles"], queryFn: fs.listProfiles });
}

export function useCreateProfile(options?: MutationOptions) {
  return useMutation({
    mutationFn: ({ uid, data }: { uid: string; data: any }) => fs.createProfile(uid, data),
    onSuccess: options?.mutation?.onSuccess,
    onError: options?.mutation?.onError,
  });
}

export function useSubmitKyc(options?: MutationOptions) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => fs.updateProfile(id, { kycStatus: "pending", ...data }),
    onSuccess: (data, vars) => { qc.invalidateQueries({ queryKey: profileKey(vars.id) }); options?.mutation?.onSuccess?.(data); },
    onError: options?.mutation?.onError,
  });
}

// ── Crews ─────────────────────────────────────────────────────────────────────

export function useListCrews() {
  return useQuery({ queryKey: ["crews"], queryFn: () => fs.listCrews() });
}

// ── Clubs ─────────────────────────────────────────────────────────────────────

export function useListClubs(sport?: string) {
  return useQuery({ queryKey: ["clubs", sport], queryFn: () => fs.listClubs(sport) });
}

export function useCreateClub(options?: MutationOptions) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ data }: { data: any }) => fs.createClub(data),
    onSuccess: (data) => { qc.invalidateQueries({ queryKey: ["clubs"] }); options?.mutation?.onSuccess?.(data); },
    onError: options?.mutation?.onError,
  });
}

export function useSubmitClubInquiry(options?: MutationOptions) {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => fs.submitClubInquiry(id, data),
    onSuccess: options?.mutation?.onSuccess,
    onError: options?.mutation?.onError,
  });
}

// ── Corp Battles ──────────────────────────────────────────────────────────────

export function useListCorpBattles(sport?: string) {
  return useQuery({ queryKey: ["corpBattles", sport], queryFn: () => fs.listCorpBattles(sport) });
}

export function useCreateCorpBattle(options?: MutationOptions) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ data }: { data: any }) => fs.createCorpBattle(data),
    onSuccess: (data) => { qc.invalidateQueries({ queryKey: ["corpBattles"] }); options?.mutation?.onSuccess?.(data); },
    onError: options?.mutation?.onError,
  });
}

// ── Stats (computed) ──────────────────────────────────────────────────────────

export function useGetSummaryStats() {
  const { data: activities = [] } = useListActivities();
  const { data: events = [] } = useListEvents();
  const { data: profiles = [] } = useListProfiles();
  return {
    data: {
      totalActivities: activities.length,
      totalEvents: events.length,
      totalProfiles: profiles.length,
      openActivities: activities.filter((a: any) => a.status === "open").length,
    },
  };
}
