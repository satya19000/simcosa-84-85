-- SIMCOSA 84-85 Batch Portal — Replit Postgres schema
-- Replaces the Supabase schema. No RLS: authorization is enforced server-side
-- in TanStack Start server functions. User ids are varchar (Replit Auth claims.sub).

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================
-- REPLIT AUTH: users + sessions
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
-- ROLES
-- =========================
DO $$ BEGIN
  CREATE TYPE app_role AS ENUM ('admin', 'member');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id varchar REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- =========================
-- PROFILES (approved defaults to true — no admin-approval gating)
-- =========================
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
  approved boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
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
  created_by varchar REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

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
  created_at timestamptz NOT NULL DEFAULT now()
);

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
