import { useEffect, useState } from "react";
import {
  collection,
  doc,
  limit as qLimit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
  type DocumentReference,
  type Query,
} from "firebase/firestore";
import {
  DEFAULT_SETTINGS,
  type ActionItem,
  type Meeting,
  type MeetingFile,
  type MeetingReport,
  type QaEntry,
  type Segment,
  type TranscriptPage,
  type UserSettings,
} from "@meetbrief/shared";
import { db } from "./firebase";

export const nowIso = () => new Date().toISOString();

export const meetingDoc = (id: string) => doc(db, "meetings", id);
export const segmentDoc = (meetingId: string, index: number) => doc(db, "meetings", meetingId, "segments", String(index).padStart(3, "0"));

interface Live<T> {
  data: T;
  loading: boolean;
  error?: string;
}

function useLiveDoc<T>(ref: DocumentReference | null, map: (id: string, d: unknown) => T, fallback: T): Live<T> {
  const [state, setState] = useState<Live<T>>({ data: fallback, loading: Boolean(ref) });
  const path = ref?.path;
  useEffect(() => {
    if (!ref) return;
    return onSnapshot(
      ref,
      (snap) => setState({ data: snap.exists() ? map(snap.id, snap.data()) : fallback, loading: false }),
      (err) => setState({ data: fallback, loading: false, error: err.message }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);
  return state;
}

function useLiveQuery<T>(q: Query | null, key: string, map: (id: string, d: unknown) => T): Live<T[]> {
  const [state, setState] = useState<Live<T[]>>({ data: [], loading: Boolean(q) });
  useEffect(() => {
    if (!q) return;
    return onSnapshot(
      q,
      (snap) => setState({ data: snap.docs.map((d) => map(d.id, d.data())), loading: false }),
      (err) => setState({ data: [], loading: false, error: err.message }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return state;
}

const withId = <T,>(id: string, d: unknown) => ({ ...(d as object), id }) as T;

export function useMeetings(uid: string, max = 50) {
  return useLiveQuery<Meeting>(
    query(collection(db, "meetings"), where("memberIds", "array-contains", uid), orderBy("createdAt", "desc"), qLimit(max)),
    `meetings-${uid}-${max}`,
    withId,
  );
}

export function useMeeting(id: string | undefined) {
  return useLiveDoc<Meeting | null>(id ? meetingDoc(id) : null, withId, null);
}

export function useSegments(meetingId: string) {
  return useLiveQuery<Segment>(query(collection(db, "meetings", meetingId, "segments"), orderBy("index")), `segs-${meetingId}`, (_id, d) => d as Segment);
}

export function useTranscript(meetingId: string) {
  return useLiveQuery<TranscriptPage & { id: string }>(
    query(collection(db, "meetings", meetingId, "transcriptPages"), orderBy("page")),
    `tp-${meetingId}`,
    withId,
  );
}

export function useReport(meetingId: string) {
  return useLiveDoc<MeetingReport | null>(doc(db, "meetings", meetingId, "reports", "current"), (_id, d) => d as MeetingReport, null);
}

export function useMeetingTasks(uid: string, meetingId: string) {
  return useLiveQuery<ActionItem>(
    query(collection(db, "tasks"), where("memberIds", "array-contains", uid), where("meetingId", "==", meetingId)),
    `tasks-${meetingId}`,
    withId,
  );
}

export function useAllTasks(uid: string) {
  return useLiveQuery<ActionItem>(
    query(collection(db, "tasks"), where("memberIds", "array-contains", uid), orderBy("createdAt", "desc"), qLimit(500)),
    `tasks-all-${uid}`,
    withId,
  );
}

export function useQa(meetingId: string) {
  return useLiveQuery<QaEntry>(query(collection(db, "meetings", meetingId, "qa"), orderBy("createdAt")), `qa-${meetingId}`, withId);
}

export function useFiles(meetingId: string) {
  return useLiveQuery<MeetingFile>(query(collection(db, "meetings", meetingId, "files")), `files-${meetingId}`, withId);
}

export function useSettings(uid: string) {
  const live = useLiveDoc<UserSettings>(doc(db, "users", uid), (_id, d) => ({ ...DEFAULT_SETTINGS, ...(d as Partial<UserSettings>) }), DEFAULT_SETTINGS);
  const save = (patch: Partial<UserSettings>) => setDoc(doc(db, "users", uid), { ...live.data, ...patch }, { merge: true });
  return { ...live, save };
}

// Patches are passed through clean(): Firestore rejects `undefined` values outright.
export async function updateMeeting(id: string, patch: Partial<Meeting>) {
  await updateDoc(meetingDoc(id), clean({ ...patch, updatedAt: nowIso() }));
}

export async function updateTask(id: string, patch: Partial<ActionItem>) {
  await updateDoc(doc(db, "tasks", id), clean({ ...patch, updatedAt: nowIso(), userEdited: true }));
}

/** Removes undefined values (Firestore rejects them). */
export function clean<T extends object>(o: T): T {
  return JSON.parse(JSON.stringify(o)) as T;
}
