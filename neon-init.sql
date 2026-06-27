-- SIMCOSA 84-85 Batch Portal — Neon Postgres initialization.
--
-- NOTE: this mirrors db/schema.sql exactly (the schema the app code in
-- src/backend/auth/*.ts and src/backend/*.ts actually queries). The "users"
-- table uses the Firebase UID as a varchar primary key (not a generated
-- uuid), sessions are stored as sid/sess(jsonb)/expire, and approval/role
-- live in separate "profiles" / "user_roles" tables rather than as columns
-- on "users". Safe to run multiple times (CREATE ... IF NOT EXISTS, enum
-- creation guarded by DO blocks).

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================
-- USERS + SESSIONS
-- =========================
CREATE TABLE IF NOT EXISTS users (
  id varchar PRIMARY KEY,
  email varchar UNIQUE,
  first_name varchar,
  last_name varchar,
  profile_image_url varchar,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  sid varchar PRIMARY KEY,
  sess jsonb NOT NULL,
  expire timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_session_expire ON sessions (expire);

-- =========================
-- PRESENCE (online members)
-- =========================
CREATE TABLE IF NOT EXISTS member_presence (
  user_id varchar PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  current_page text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- =========================
-- ROLES
-- =========================
DO $$ BEGIN
  CREATE TYPE app_role AS ENUM ('admin', 'member', 'owner');
EXCEPTION WHEN duplicate_object THEN null; END $$;
-- Idempotent migration: add 'owner' to existing databases.
DO $$ BEGIN
  ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'owner';
EXCEPTION WHEN others THEN null; END $$;

CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id varchar REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles (role);

-- =========================
-- PROFILES (new signups are pending until an admin approves them)
-- =========================
DO $$ BEGIN
  CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected', 'needs_clarification');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS profiles (
  id varchar PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  photo_url text,
  phone text,
  whatsapp text,
  email text,
  location text,
  profession text,
  bio text,
  spouse_name text,
  clinic_or_hospital text,
  country_state text,
  batch_confirmed boolean NOT NULL DEFAULT false,
  approved boolean NOT NULL DEFAULT false,
  approval_status approval_status NOT NULL DEFAULT 'pending',
  approved_by varchar REFERENCES users(id) ON DELETE SET NULL,
  approved_at timestamptz,
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_profiles_approval_status ON profiles (approval_status);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles (email);

-- Profile photo binary storage.
CREATE TABLE IF NOT EXISTS profile_photos (
  user_id varchar PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  mime text NOT NULL,
  data bytea NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =========================
-- EVENTS + RSVPs
-- =========================
DO $$ BEGIN
  CREATE TYPE rsvp_status AS ENUM ('attending', 'maybe', 'not_attending');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  location text,
  event_date timestamptz NOT NULL,
  cover_url text,
  cover_data bytea,
  cover_mime text,
  created_by varchar REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE events ADD COLUMN IF NOT EXISTS cover_data bytea;
ALTER TABLE events ADD COLUMN IF NOT EXISTS cover_mime text;
-- Firebase-Storage upload migration: covers now live in Firebase Storage,
-- reusing existing cover_url; cover_data/cover_mime stay for old rows only.
ALTER TABLE events ADD COLUMN IF NOT EXISTS fb_storage_path text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS file_name text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS file_size bigint;
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_published boolean;

CREATE TABLE IF NOT EXISTS event_rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  user_id varchar REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  status rsvp_status NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- =========================
-- GALLERY
-- =========================
CREATE TABLE IF NOT EXISTS gallery_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  caption text,
  media_type text NOT NULL DEFAULT 'image',
  storage_path text NOT NULL,
  mime text,
  data bytea,
  uploaded_by varchar REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
-- Firebase-Storage upload migration: new uploads store a Firebase Storage
-- URL + object path + metadata instead of raw bytea. `storage_path` above is
-- an existing caption/display fallback used in the UI — fb_storage_path is
-- the new Firebase object path used for Storage deletes.
ALTER TABLE gallery_items ADD COLUMN IF NOT EXISTS file_url text;
ALTER TABLE gallery_items ADD COLUMN IF NOT EXISTS fb_storage_path text;
ALTER TABLE gallery_items ADD COLUMN IF NOT EXISTS file_name text;
ALTER TABLE gallery_items ADD COLUMN IF NOT EXISTS mime_type text;
ALTER TABLE gallery_items ADD COLUMN IF NOT EXISTS file_size bigint;
ALTER TABLE gallery_items ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
-- Optional per-photo memory details (location, date, people, description)
ALTER TABLE gallery_items ADD COLUMN IF NOT EXISTS location text;
ALTER TABLE gallery_items ADD COLUMN IF NOT EXISTS taken_date date;
ALTER TABLE gallery_items ADD COLUMN IF NOT EXISTS people text;
-- Manual photo ordering (admin drag/reorder); lower sorts first.
ALTER TABLE gallery_items ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_gallery_items_sort_order ON gallery_items(sort_order, created_at DESC);

CREATE TABLE IF NOT EXISTS gallery_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_item_id uuid REFERENCES gallery_items(id) ON DELETE CASCADE NOT NULL,
  user_id varchar REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(gallery_item_id, user_id)
);

CREATE TABLE IF NOT EXISTS gallery_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_item_id uuid REFERENCES gallery_items(id) ON DELETE CASCADE NOT NULL,
  user_id varchar REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  comment text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

-- =========================
-- SUPPORT REQUESTS
-- =========================
DO $$ BEGIN
  CREATE TYPE support_category AS ENUM ('medical','financial','emotional','family','other');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS support_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id varchar REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  category support_category NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =========================
-- ANNOUNCEMENTS
-- =========================
DO $$ BEGIN
  CREATE TYPE announcement_kind AS ENUM ('birthday','achievement','condolence','notice');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind announcement_kind NOT NULL DEFAULT 'notice',
  title text NOT NULL,
  body text,
  created_by varchar REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =========================
-- DONATIONS + EXPENSES
-- =========================
CREATE TABLE IF NOT EXISTS donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_name text NOT NULL,
  amount numeric(12,2) NOT NULL,
  purpose text,
  donated_on date NOT NULL DEFAULT CURRENT_DATE,
  created_by varchar REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  description text NOT NULL,
  amount numeric(12,2) NOT NULL,
  spent_on date NOT NULL DEFAULT CURRENT_DATE,
  category text,
  created_by varchar REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =========================
-- MEMORIES + LIKES + COMMENTS
-- =========================
CREATE TABLE IF NOT EXISTS memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id varchar REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title text,
  body text NOT NULL,
  image_url text,
  image_data bytea,
  image_mime text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE memories ADD COLUMN IF NOT EXISTS image_data bytea;
ALTER TABLE memories ADD COLUMN IF NOT EXISTS image_mime text;
-- Firebase-Storage upload migration: new uploads reuse existing image_url
-- (now a Firebase Storage download URL) and stop writing image_data.
ALTER TABLE memories ADD COLUMN IF NOT EXISTS fb_storage_path text;
ALTER TABLE memories ADD COLUMN IF NOT EXISTS file_name text;
ALTER TABLE memories ADD COLUMN IF NOT EXISTS file_size bigint;
-- Optional display name override, e.g. an admin posting on behalf of a batchmate.
-- Falls back to the uploader's profile full_name when null/empty.
ALTER TABLE memories ADD COLUMN IF NOT EXISTS author_name text;

-- Child table: supports many images per memory post. Legacy single-image
-- memories (image_url/fb_storage_path on memories itself) keep working;
-- listMemories() maps them into the images array when no rows exist here.
CREATE TABLE IF NOT EXISTS memory_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id uuid REFERENCES memories(id) ON DELETE CASCADE NOT NULL,
  image_url text NOT NULL,
  fb_storage_path text,
  file_name text,
  mime_type text,
  file_size bigint,
  sort_order integer DEFAULT 0,
  attachment_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);
-- Idempotent migration: add attachment_type if upgrading existing DB.
ALTER TABLE memory_images ADD COLUMN IF NOT EXISTS attachment_type text;
CREATE INDEX IF NOT EXISTS idx_memory_images_memory_sort_order ON memory_images(memory_id, sort_order, created_at);
-- Unique guard: skip gracefully if existing duplicate rows prevent index creation.
DO $$ BEGIN
  CREATE UNIQUE INDEX idx_memory_images_no_duplicate_file
  ON memory_images(memory_id, file_name, file_size)
  WHERE file_name IS NOT NULL AND file_size IS NOT NULL;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'idx_memory_images_no_duplicate_file skipped (may already exist or duplicates present).';
END $$;

CREATE TABLE IF NOT EXISTS memory_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id uuid REFERENCES memories(id) ON DELETE CASCADE NOT NULL,
  user_id varchar REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(memory_id, user_id)
);

CREATE TABLE IF NOT EXISTS memory_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id uuid REFERENCES memories(id) ON DELETE CASCADE NOT NULL,
  user_id varchar REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =========================
-- BLOGS + LIKES + COMMENTS
-- =========================
DO $$ BEGIN
  CREATE TYPE blog_category AS ENUM ('opinions','poems','health_tips','memories','events','general');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS blogs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id varchar REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  excerpt text,
  category blog_category NOT NULL DEFAULT 'general',
  image_data bytea,
  image_mime text,
  is_featured boolean NOT NULL DEFAULT false,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- Firebase-Storage upload migration: blogs previously had no URL column
-- (only image_data/image_mime bytea); new uploads store a Firebase Storage
-- URL + object path + metadata instead.
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS fb_storage_path text;
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS file_name text;
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS file_size bigint;

CREATE TABLE IF NOT EXISTS blog_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_id uuid REFERENCES blogs(id) ON DELETE CASCADE NOT NULL,
  user_id varchar REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(blog_id, user_id)
);

CREATE TABLE IF NOT EXISTS blog_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_id uuid REFERENCES blogs(id) ON DELETE CASCADE NOT NULL,
  user_id varchar REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =========================
-- MAKE FIRST ADMIN
-- =========================
-- Run this manually after the user has signed in at least once (so their
-- "users"/"profiles" rows exist). Approval and role live in separate
-- tables in this schema, not as columns on "users":
--
--   UPDATE profiles SET approved = true, approval_status = 'approved'
--     WHERE id = (SELECT id FROM users WHERE email = 'satya196500@gmail.com');
--
--   INSERT INTO user_roles (user_id, role)
--     SELECT id, 'admin' FROM users WHERE email = 'satya196500@gmail.com'
--     ON CONFLICT (user_id, role) DO NOTHING;
