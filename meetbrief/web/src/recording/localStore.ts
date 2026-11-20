import { openDB, type DBSchema, type IDBPDatabase } from "idb";

/**
 * Local buffer in IndexedDB. Every chunk is written here *before* upload, so a crash, tab close
 * or network loss loses at most the chunk being recorded (default 10 s). Chunks are removed once
 * their whole segment is confirmed uploaded.
 */
export interface StoredChunk {
  key: string; // meetingId/segment/chunk
  meetingId: string;
  segmentIndex: number;
  chunkIndex: number;
  blob: Blob;
  uploaded: boolean;
}

export interface StoredSegment {
  key: string; // meetingId/segment
  meetingId: string;
  segmentIndex: number;
  mimeType: string;
  startedAt: string;
  endedAt?: string;
  durationMs: number;
  /** Known final chunk count once the segment was stopped cleanly. */
  finalChunkCount?: number;
  /** All chunks uploaded and segment doc marked uploaded. */
  done: boolean;
}

interface Schema extends DBSchema {
  chunks: { key: string; value: StoredChunk; indexes: { bySegment: [string, number] } };
  segments: { key: string; value: StoredSegment; indexes: { byMeeting: string } };
}

let dbp: Promise<IDBPDatabase<Schema>> | undefined;
function getDb() {
  if (!dbp) {
    dbp = openDB<Schema>("meetbrief-recordings", 1, {
      upgrade(db) {
        const c = db.createObjectStore("chunks", { keyPath: "key" });
        c.createIndex("bySegment", ["meetingId", "segmentIndex"]);
        const s = db.createObjectStore("segments", { keyPath: "key" });
        s.createIndex("byMeeting", "meetingId");
      },
    });
  }
  return dbp;
}

export const chunkKey = (m: string, s: number, c: number) => `${m}/${s}/${c}`;
export const segKey = (m: string, s: number) => `${m}/${s}`;

export const localStore = {
  async putChunk(c: StoredChunk) {
    await (await getDb()).put("chunks", c);
  },
  async markChunkUploaded(key: string) {
    const db = await getDb();
    const c = await db.get("chunks", key);
    if (c) await db.put("chunks", { ...c, uploaded: true });
  },
  async segmentChunks(meetingId: string, segmentIndex: number) {
    const list = await (await getDb()).getAllFromIndex("chunks", "bySegment", [meetingId, segmentIndex]);
    return list.sort((a, b) => a.chunkIndex - b.chunkIndex);
  },
  async putSegment(s: StoredSegment) {
    await (await getDb()).put("segments", s);
  },
  async getSegment(key: string) {
    return (await getDb()).get("segments", key);
  },
  async allSegments() {
    return (await getDb()).getAll("segments");
  },
  /** Free space once the server has every chunk of a segment. */
  async clearSegmentChunks(meetingId: string, segmentIndex: number) {
    const db = await getDb();
    const tx = db.transaction("chunks", "readwrite");
    const keys = await tx.store.index("bySegment").getAllKeys([meetingId, segmentIndex]);
    await Promise.all(keys.map((k) => tx.store.delete(k)));
    await tx.done;
  },
  async deleteSegment(key: string) {
    await (await getDb()).delete("segments", key);
  },
};

export interface StorageHealth {
  usageBytes?: number;
  quotaBytes?: number;
  availableBytes?: number;
  persisted?: boolean;
  low: boolean;
}

/** Ask the browser not to evict our buffer, and report how much room is left. */
export async function checkStorage(): Promise<StorageHealth> {
  if (!navigator.storage?.estimate) return { low: false };
  const persisted = (await navigator.storage.persisted?.()) || (await navigator.storage.persist?.().catch(() => false));
  const { usage = 0, quota = 0 } = await navigator.storage.estimate();
  const available = quota - usage;
  return { usageBytes: usage, quotaBytes: quota, availableBytes: available, persisted: Boolean(persisted), low: quota > 0 && available < 200 * 1024 * 1024 };
}
