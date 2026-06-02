import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  query,
  orderBy,
  where,
  runTransaction,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

function toObj<T>(snap: any): T & { id: string } {
  const data = snap.data();
  const out: any = { ...data, id: snap.id };
  if (data.createdAt instanceof Timestamp) out.createdAt = data.createdAt.toDate().toISOString();
  if (data.expiresAt instanceof Timestamp) out.expiresAt = data.expiresAt.toDate().toISOString();
  else if (data.expiresAt === undefined) out.expiresAt = null;
  return out;
}

// ── Activities ────────────────────────────────────────────────────────────────

export async function listActivities(filters?: Record<string, string>) {
  const snap = await getDocs(query(collection(db, "activities"), orderBy("createdAt", "desc")));
  let items = snap.docs.map(d => toObj<any>(d));
  if (filters?.type) items = items.filter(a => a.type === filters.type);
  if (filters?.status) items = items.filter(a => a.status === filters.status);
  if (filters?.skillLevel) items = items.filter(a => a.skillLevel === filters.skillLevel);
  if (filters?.genderPref) items = items.filter(a => a.genderPref === filters.genderPref);
  if (filters?.activityKind) items = items.filter(a => a.activityKind === filters.activityKind);
  return items;
}

export async function getActivity(id: string) {
  const snap = await getDoc(doc(db, "activities", id));
  return snap.exists() ? toObj<any>(snap) : null;
}

export async function createActivity(data: any) {
  const maxPlayers = Number(data.maxPlayers);
  const venueFee = data.venueFee ?? null;
  const estimatedCostPerPerson = venueFee && maxPlayers > 0 ? Math.round(venueFee / maxPlayers) : null;
  const ref = await addDoc(collection(db, "activities"), {
    ...data,
    maxPlayers,
    currentPlayers: 1,
    estimatedCostPerPerson,
    status: "open",
    createdAt: serverTimestamp(),
  });
  return { ...data, id: ref.id, maxPlayers, currentPlayers: 1, status: "open", estimatedCostPerPerson };
}

export async function joinActivity(id: string) {
  return runTransaction(db, async (tx) => {
    const ref = doc(db, "activities", id);
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("Not found");
    const d = snap.data();
    if (d.status === "full" || d.currentPlayers >= d.maxPlayers) throw new Error("Activity is full");
    const newCount = d.currentPlayers + 1;
    const newStatus = newCount >= d.maxPlayers ? "full" : "open";
    const newCost = d.venueFee ? Math.round(d.venueFee / newCount) : d.estimatedCostPerPerson;
    tx.update(ref, { currentPlayers: newCount, status: newStatus, estimatedCostPerPerson: newCost });
    return { ...d, id, currentPlayers: newCount, status: newStatus };
  });
}

export async function getActivityRatings(activityId: string) {
  const snap = await getDocs(collection(db, "activities", activityId, "ratings"));
  return snap.docs.map(d => toObj<any>(d));
}

export async function rateActivityPlayer(activityId: string, data: any) {
  const ref = await addDoc(collection(db, "activities", activityId, "ratings"), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return { id: ref.id, ...data };
}

// ── Events ────────────────────────────────────────────────────────────────────

export async function listEvents(filters?: Record<string, string>) {
  const snap = await getDocs(query(collection(db, "events"), orderBy("createdAt", "desc")));
  let items = snap.docs.map(d => toObj<any>(d));
  if (filters?.type) items = items.filter(e => e.type === filters.type);
  if (filters?.status) items = items.filter(e => e.status === filters.status);
  return items;
}

export async function getEvent(id: string) {
  const snap = await getDoc(doc(db, "events", id));
  return snap.exists() ? toObj<any>(snap) : null;
}

export async function createEvent(data: any) {
  const ref = await addDoc(collection(db, "events"), {
    ...data,
    currentAttendees: 1,
    status: "open",
    createdAt: serverTimestamp(),
  });
  return { ...data, id: ref.id, currentAttendees: 1, status: "open" };
}

export async function joinEvent(id: string) {
  return runTransaction(db, async (tx) => {
    const ref = doc(db, "events", id);
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("Not found");
    const d = snap.data();
    if (d.status === "full" || d.currentAttendees >= d.maxAttendees) throw new Error("Event is full");
    const newCount = d.currentAttendees + 1;
    const newStatus = newCount >= d.maxAttendees ? "full" : "open";
    tx.update(ref, { currentAttendees: newCount, status: newStatus });
    return { ...d, id, currentAttendees: newCount, status: newStatus };
  });
}

export async function getEventRatings(eventId: string) {
  const snap = await getDocs(collection(db, "events", eventId, "ratings"));
  return snap.docs.map(d => toObj<any>(d));
}

export async function rateEventPlayer(eventId: string, data: any) {
  const ref = await addDoc(collection(db, "events", eventId, "ratings"), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return { id: ref.id, ...data };
}

// ── Profiles ──────────────────────────────────────────────────────────────────

export async function getProfile(id: string) {
  const snap = await getDoc(doc(db, "profiles", id));
  return snap.exists() ? { ...snap.data(), id: snap.id } : null;
}

export async function getProfileByPhone(phone: string) {
  const snap = await getDocs(query(collection(db, "profiles"), where("phone", "==", phone)));
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { ...d.data(), id: d.id };
}

export async function createProfile(uid: string, data: any) {
  await setDoc(doc(db, "profiles", uid), {
    ...data,
    kycStatus: "none",
    gamesPlayed: 0,
    gamesHosted: 0,
    streakWeeks: 0,
    reputationTags: [],
    createdAt: serverTimestamp(),
  });
  return { id: uid, ...data };
}

export async function updateProfile(id: string, data: any) {
  await updateDoc(doc(db, "profiles", id), data);
  return { id, ...data };
}

export async function listProfiles() {
  const snap = await getDocs(collection(db, "profiles"));
  return snap.docs.map(d => ({ ...d.data(), id: d.id }));
}

// ── Crews ─────────────────────────────────────────────────────────────────────

export async function listCrews(sport?: string) {
  const snap = await getDocs(collection(db, "crews"));
  let items = snap.docs.map(d => toObj<any>(d));
  if (sport) items = items.filter(c => c.sport === sport);
  return items;
}

// ── Clubs ─────────────────────────────────────────────────────────────────────

export async function listClubs(sport?: string) {
  const snap = await getDocs(collection(db, "clubs"));
  let items = snap.docs.map(d => toObj<any>(d));
  if (sport) items = items.filter(c => c.sport === sport);
  return items;
}

export async function createClub(data: any) {
  const members: string[] = data.memberNames ?? [data.leaderName];
  const ref = await addDoc(collection(db, "clubs"), {
    ...data,
    memberNames: members,
    memberCount: members.length,
    isExclusive: data.isExclusive ?? true,
    city: "Ahmedabad",
    reliabilityScore: 80,
    avgDopeLevel: 5,
    wins: 0,
    losses: 0,
    createdAt: serverTimestamp(),
  });
  return { id: ref.id, ...data, memberNames: members, memberCount: members.length, wins: 0, losses: 0 };
}

export async function submitClubInquiry(clubId: string, data: any) {
  const ref = await addDoc(collection(db, "clubs", clubId, "inquiries"), {
    ...data,
    status: "pending",
    createdAt: serverTimestamp(),
  });
  return { id: ref.id, ...data };
}

// ── Corp Battles ──────────────────────────────────────────────────────────────

export async function listCorpBattles(sport?: string) {
  const snap = await getDocs(collection(db, "corpBattles"));
  let items = snap.docs.map(d => toObj<any>(d));
  if (sport) items = items.filter(b => b.sport === sport);
  return items;
}

export async function createCorpBattle(data: any) {
  const ref = await addDoc(collection(db, "corpBattles"), {
    ...data,
    result: "pending",
    createdAt: serverTimestamp(),
  });
  return { id: ref.id, ...data, result: "pending" };
}
