import { createServerFn } from "@tanstack/react-start";
import { requireApproved } from "../backend/auth/middleware";
import { query } from "../backend/db";

export interface MemoryComment {
  id: string;
  body: string;
  user_id: string;
  created_at: string;
  profiles: { full_name: string } | null;
}

export interface MemoryRow {
  id: string;
  title: string | null;
  body: string;
  image_url: string | null;
  created_at: string;
  profiles: { full_name: string } | null;
  memory_likes: { user_id: string }[];
  memory_comments: MemoryComment[];
}

export const listMemories = createServerFn({ method: "GET" })
  .middleware([requireApproved])
  .handler(async (): Promise<MemoryRow[]> => {
    const res = await query<MemoryRow>(
      `SELECT
         m.id, m.title, m.body, m.image_url, m.created_at,
         json_build_object('full_name', p.full_name) AS profiles,
         COALESCE((
           SELECT json_agg(json_build_object('user_id', ml.user_id))
           FROM memory_likes ml WHERE ml.memory_id = m.id
         ), '[]'::json) AS memory_likes,
         COALESCE((
           SELECT json_agg(json_build_object(
             'id', mc.id, 'body', mc.body, 'user_id', mc.user_id,
             'created_at', mc.created_at,
             'profiles', json_build_object('full_name', cp.full_name)
           ) ORDER BY mc.created_at ASC)
           FROM memory_comments mc
           LEFT JOIN profiles cp ON cp.id = mc.user_id
           WHERE mc.memory_id = m.id
         ), '[]'::json) AS memory_comments
       FROM memories m
       LEFT JOIN profiles p ON p.id = m.user_id
       ORDER BY m.created_at DESC`,
    );
    return res.rows;
  });

export const postMemory = createServerFn({ method: "POST" })
  .middleware([requireApproved])
  .inputValidator((d: { title?: string; body: string }) => d)
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await query(
      `INSERT INTO memories (user_id, title, body) VALUES ($1, $2, $3)`,
      [context.userId, data.title || null, data.body],
    );
    return { ok: true };
  });

export const toggleLike = createServerFn({ method: "POST" })
  .middleware([requireApproved])
  .inputValidator((d: { memoryId: string; liked: boolean }) => d)
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    if (data.liked) {
      await query(
        `DELETE FROM memory_likes WHERE memory_id = $1 AND user_id = $2`,
        [data.memoryId, context.userId],
      );
    } else {
      await query(
        `INSERT INTO memory_likes (memory_id, user_id) VALUES ($1, $2)
         ON CONFLICT (memory_id, user_id) DO NOTHING`,
        [data.memoryId, context.userId],
      );
    }
    return { ok: true };
  });

export const addComment = createServerFn({ method: "POST" })
  .middleware([requireApproved])
  .inputValidator((d: { memoryId: string; body: string }) => d)
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await query(
      `INSERT INTO memory_comments (memory_id, user_id, body) VALUES ($1, $2, $3)`,
      [data.memoryId, context.userId, data.body],
    );
    return { ok: true };
  });
