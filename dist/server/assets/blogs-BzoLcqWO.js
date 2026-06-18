import { c as createServerRpc } from "./createServerRpc-DoLQqN4P.js";
import { r as requireAuth, a as requireAdmin } from "./middleware-D7ktv78M.js";
import { q as query } from "../server.js";
import { c as createServerFn } from "./server-DU9y0RcP.js";
import "./createMiddleware-BvN2ghIY.js";
import "node:crypto";
import "pg";
import "jose";
import "node:async_hooks";
import "h3-v2";
import "@tanstack/router-core";
import "seroval";
import "@tanstack/history";
import "@tanstack/router-core/ssr/client";
import "@tanstack/router-core/ssr/server";
import "react";
import "@tanstack/react-router";
import "react/jsx-runtime";
import "@tanstack/react-router/ssr/server";
const LIST_COLUMNS = `
  b.id, b.author_id, b.title, b.content, b.excerpt, b.category,
  CASE WHEN b.image_data IS NOT NULL THEN '/api/blogs/image/' || b.id ELSE NULL END AS image_url,
  b.is_featured, b.is_published, b.created_at, b.updated_at,
  json_build_object('full_name', p.full_name) AS profiles,
  COALESCE((
    SELECT json_agg(json_build_object('user_id', bl.user_id))
    FROM blog_likes bl WHERE bl.blog_id = b.id
  ), '[]'::json) AS blog_likes
`;
const listBlogs_createServerFn_handler = createServerRpc({
  id: "8686183d6a6ba2b592b6701a4744f2382ab793460bb9170eef3e065c8053f712",
  name: "listBlogs",
  filename: "src/api/blogs.ts"
}, (opts) => listBlogs.__executeServer(opts));
const listBlogs = createServerFn({
  method: "GET"
}).middleware([requireAuth]).inputValidator((d) => d).handler(listBlogs_createServerFn_handler, async ({
  data,
  context
}) => {
  const params = [];
  const conditions = [];
  if (!context.isAdmin) conditions.push(`(b.is_published = true OR b.author_id = $${params.push(context.userId)})`);
  if (data?.category) conditions.push(`b.category = $${params.push(data.category)}`);
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const res = await query(`SELECT ${LIST_COLUMNS}, '[]'::json AS blog_comments
       FROM blogs b
       LEFT JOIN profiles p ON p.id = b.author_id
       ${where}
       ORDER BY b.is_featured DESC, b.created_at DESC`, params);
  return res.rows;
});
const getBlog_createServerFn_handler = createServerRpc({
  id: "47d1f3f1865d7310115b58213d25b1a381eb05d7edc8565b16c233590fa03d84",
  name: "getBlog",
  filename: "src/api/blogs.ts"
}, (opts) => getBlog.__executeServer(opts));
const getBlog = createServerFn({
  method: "GET"
}).middleware([requireAuth]).inputValidator((d) => d).handler(getBlog_createServerFn_handler, async ({
  data,
  context
}) => {
  const res = await query(`SELECT ${LIST_COLUMNS},
         COALESCE((
           SELECT json_agg(json_build_object(
             'id', bc.id, 'body', bc.body, 'user_id', bc.user_id,
             'created_at', bc.created_at,
             'profiles', json_build_object('full_name', cp.full_name)
           ) ORDER BY bc.created_at ASC)
           FROM blog_comments bc
           LEFT JOIN profiles cp ON cp.id = bc.user_id
           WHERE bc.blog_id = b.id
         ), '[]'::json) AS blog_comments
       FROM blogs b
       LEFT JOIN profiles p ON p.id = b.author_id
       WHERE b.id = $1`, [data.id]);
  const row = res.rows[0];
  if (!row) return null;
  if (!row.is_published && row.author_id !== context.userId && !context.isAdmin) return null;
  return row;
});
const createBlog_createServerFn_handler = createServerRpc({
  id: "ce5407d6be6a5dc5170d1fd12bd3c7dd623a3b20751f26c3ca533a362ffb5584",
  name: "createBlog",
  filename: "src/api/blogs.ts"
}, (opts) => createBlog.__executeServer(opts));
const createBlog = createServerFn({
  method: "POST"
}).middleware([requireAuth]).inputValidator((d) => d).handler(createBlog_createServerFn_handler, async ({
  data,
  context
}) => {
  const title = String(data.get("title") ?? "").trim();
  const content = String(data.get("content") ?? "").trim();
  const excerpt = String(data.get("excerpt") ?? "").trim();
  const category = String(data.get("category") ?? "general");
  if (!title || !content) throw new Error("Title and content are required");
  const file = data.get("image");
  let imageBytes = null;
  let imageMime = null;
  if (file && typeof file !== "string" && file.size > 0) {
    imageBytes = Buffer.from(await file.arrayBuffer());
    imageMime = file.type || "application/octet-stream";
  }
  const autoExcerpt = excerpt || content.slice(0, 180);
  const res = await query(`INSERT INTO blogs (author_id, title, content, excerpt, category, image_data, image_mime)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`, [context.userId, title, content, autoExcerpt, category, imageBytes, imageMime]);
  return {
    ok: true,
    id: res.rows[0].id
  };
});
const updateBlog_createServerFn_handler = createServerRpc({
  id: "23b737aab2c939f4b2c85fb517e41f21ea9455c0d69802b5ee61213aa5d0825d",
  name: "updateBlog",
  filename: "src/api/blogs.ts"
}, (opts) => updateBlog.__executeServer(opts));
const updateBlog = createServerFn({
  method: "POST"
}).middleware([requireAuth]).inputValidator((d) => d).handler(updateBlog_createServerFn_handler, async ({
  data,
  context
}) => {
  const owned = await query(`SELECT author_id FROM blogs WHERE id = $1`, [data.id]);
  const row = owned.rows[0];
  if (!row) throw new Error("Blog not found");
  if (row.author_id !== context.userId && !context.isAdmin) throw new Error("Forbidden");
  await query(`UPDATE blogs SET title = $1, content = $2, excerpt = $3, category = $4, updated_at = now() WHERE id = $5`, [data.title, data.content, data.excerpt || data.content.slice(0, 180), data.category, data.id]);
  return {
    ok: true
  };
});
const deleteBlog_createServerFn_handler = createServerRpc({
  id: "93b2e42f92a3ed4f183a5d3c06e2139a5aef3bf6a43bd185ba1de268d2dde104",
  name: "deleteBlog",
  filename: "src/api/blogs.ts"
}, (opts) => deleteBlog.__executeServer(opts));
const deleteBlog = createServerFn({
  method: "POST"
}).middleware([requireAuth]).inputValidator((d) => d).handler(deleteBlog_createServerFn_handler, async ({
  data,
  context
}) => {
  const owned = await query(`SELECT author_id FROM blogs WHERE id = $1`, [data.id]);
  const row = owned.rows[0];
  if (!row) throw new Error("Blog not found");
  if (row.author_id !== context.userId && !context.isAdmin) throw new Error("Forbidden");
  await query(`DELETE FROM blogs WHERE id = $1`, [data.id]);
  return {
    ok: true
  };
});
const toggleBlogLike_createServerFn_handler = createServerRpc({
  id: "a9c4a56341797bb0c8d7cb03f843a0404199d790e22d46d41be3dd59b826f7f5",
  name: "toggleBlogLike",
  filename: "src/api/blogs.ts"
}, (opts) => toggleBlogLike.__executeServer(opts));
const toggleBlogLike = createServerFn({
  method: "POST"
}).middleware([requireAuth]).inputValidator((d) => d).handler(toggleBlogLike_createServerFn_handler, async ({
  data,
  context
}) => {
  if (data.liked) {
    await query(`DELETE FROM blog_likes WHERE blog_id = $1 AND user_id = $2`, [data.blogId, context.userId]);
  } else {
    await query(`INSERT INTO blog_likes (blog_id, user_id) VALUES ($1, $2) ON CONFLICT (blog_id, user_id) DO NOTHING`, [data.blogId, context.userId]);
  }
  return {
    ok: true
  };
});
const addBlogComment_createServerFn_handler = createServerRpc({
  id: "2f2d99b2535c6293c0dcfb019144edb5c94344e062f7843bcee721057985e492",
  name: "addBlogComment",
  filename: "src/api/blogs.ts"
}, (opts) => addBlogComment.__executeServer(opts));
const addBlogComment = createServerFn({
  method: "POST"
}).middleware([requireAuth]).inputValidator((d) => d).handler(addBlogComment_createServerFn_handler, async ({
  data,
  context
}) => {
  await query(`INSERT INTO blog_comments (blog_id, user_id, body) VALUES ($1, $2, $3)`, [data.blogId, context.userId, data.body]);
  return {
    ok: true
  };
});
const setBlogFeatured_createServerFn_handler = createServerRpc({
  id: "d0d8f90a3ba48085c5ca0a3b75d8b60a2b51d7f4ca225cf37291c5308760796a",
  name: "setBlogFeatured",
  filename: "src/api/blogs.ts"
}, (opts) => setBlogFeatured.__executeServer(opts));
const setBlogFeatured = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => d).handler(setBlogFeatured_createServerFn_handler, async ({
  data
}) => {
  await query(`UPDATE blogs SET is_featured = $1 WHERE id = $2`, [data.featured, data.id]);
  return {
    ok: true
  };
});
const setBlogPublished_createServerFn_handler = createServerRpc({
  id: "204075850850b80f6d04c75f371e7e4d6d5172ed82bc69c377ff72553f57df0c",
  name: "setBlogPublished",
  filename: "src/api/blogs.ts"
}, (opts) => setBlogPublished.__executeServer(opts));
const setBlogPublished = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => d).handler(setBlogPublished_createServerFn_handler, async ({
  data
}) => {
  await query(`UPDATE blogs SET is_published = $1 WHERE id = $2`, [data.published, data.id]);
  return {
    ok: true
  };
});
export {
  addBlogComment_createServerFn_handler,
  createBlog_createServerFn_handler,
  deleteBlog_createServerFn_handler,
  getBlog_createServerFn_handler,
  listBlogs_createServerFn_handler,
  setBlogFeatured_createServerFn_handler,
  setBlogPublished_createServerFn_handler,
  toggleBlogLike_createServerFn_handler,
  updateBlog_createServerFn_handler
};
