
-- =========================
-- ROLES
-- =========================
CREATE TYPE public.app_role AS ENUM ('admin', 'member');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users can see their own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can see all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========================
-- PROFILES
-- =========================
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  photo_url text,
  phone text,
  whatsapp text,
  email text,
  location text,
  profession text,
  bio text,
  approved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_approved(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id AND approved = true)
$$;

CREATE POLICY "Users see own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Approved members see directory" ON public.profiles
  FOR SELECT TO authenticated USING (public.is_approved(auth.uid()) AND approved = true);
CREATE POLICY "Admins see all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admins update any profile" ON public.profiles
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Auto-create profile + member role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.email);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'member');
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================
-- EVENTS + RSVPs
-- =========================
CREATE TYPE public.rsvp_status AS ENUM ('attending', 'maybe', 'not_attending');

CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  location text,
  event_date timestamptz NOT NULL,
  cover_url text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Approved members see events" ON public.events FOR SELECT TO authenticated USING (public.is_approved(auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage events" ON public.events FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.event_rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status public.rsvp_status NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_rsvps TO authenticated;
GRANT ALL ON public.event_rsvps TO service_role;
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Approved members see rsvps" ON public.event_rsvps FOR SELECT TO authenticated USING (public.is_approved(auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Members manage own rsvp" ON public.event_rsvps FOR ALL TO authenticated USING (auth.uid() = user_id AND public.is_approved(auth.uid())) WITH CHECK (auth.uid() = user_id);

-- =========================
-- GALLERY
-- =========================
CREATE TABLE public.gallery_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  caption text,
  media_type text NOT NULL DEFAULT 'image',
  storage_path text NOT NULL,
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gallery_items TO authenticated;
GRANT ALL ON public.gallery_items TO service_role;
ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Approved see gallery" ON public.gallery_items FOR SELECT TO authenticated USING (public.is_approved(auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Approved upload" ON public.gallery_items FOR INSERT TO authenticated WITH CHECK (public.is_approved(auth.uid()) AND auth.uid() = uploaded_by);
CREATE POLICY "Owner or admin delete" ON public.gallery_items FOR DELETE TO authenticated USING (auth.uid() = uploaded_by OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admin update gallery" ON public.gallery_items FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- =========================
-- SUPPORT REQUESTS
-- =========================
CREATE TYPE public.support_category AS ENUM ('medical','financial','emotional','family','other');

CREATE TABLE public.support_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category public.support_category NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.support_requests TO authenticated;
GRANT ALL ON public.support_requests TO service_role;
ALTER TABLE public.support_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner sees own request" ON public.support_requests FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins see all requests" ON public.support_requests FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Approved create request" ON public.support_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND public.is_approved(auth.uid()));
CREATE POLICY "Admins update requests" ON public.support_requests FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- =========================
-- ANNOUNCEMENTS
-- =========================
CREATE TYPE public.announcement_kind AS ENUM ('birthday','achievement','condolence','notice');

CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind public.announcement_kind NOT NULL DEFAULT 'notice',
  title text NOT NULL,
  body text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcements TO authenticated;
GRANT ALL ON public.announcements TO service_role;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Approved see announcements" ON public.announcements FOR SELECT TO authenticated USING (public.is_approved(auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage announcements" ON public.announcements FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- =========================
-- DONATIONS + EXPENSES
-- =========================
CREATE TABLE public.donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_name text NOT NULL,
  amount numeric(12,2) NOT NULL,
  purpose text,
  donated_on date NOT NULL DEFAULT CURRENT_DATE,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.donations TO authenticated;
GRANT ALL ON public.donations TO service_role;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Approved see donations" ON public.donations FOR SELECT TO authenticated USING (public.is_approved(auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage donations" ON public.donations FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  description text NOT NULL,
  amount numeric(12,2) NOT NULL,
  spent_on date NOT NULL DEFAULT CURRENT_DATE,
  category text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expenses TO authenticated;
GRANT ALL ON public.expenses TO service_role;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Approved see expenses" ON public.expenses FOR SELECT TO authenticated USING (public.is_approved(auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage expenses" ON public.expenses FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- =========================
-- MEMORIES + LIKES + COMMENTS
-- =========================
CREATE TABLE public.memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text,
  body text NOT NULL,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.memories TO authenticated;
GRANT ALL ON public.memories TO service_role;
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Approved see memories" ON public.memories FOR SELECT TO authenticated USING (public.is_approved(auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Approved post memory" ON public.memories FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND public.is_approved(auth.uid()));
CREATE POLICY "Owner update memory" ON public.memories FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owner or admin delete memory" ON public.memories FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.memory_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id uuid REFERENCES public.memories(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(memory_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.memory_likes TO authenticated;
GRANT ALL ON public.memory_likes TO service_role;
ALTER TABLE public.memory_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Approved see likes" ON public.memory_likes FOR SELECT TO authenticated USING (public.is_approved(auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Approved like" ON public.memory_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND public.is_approved(auth.uid()));
CREATE POLICY "Owner unlike" ON public.memory_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.memory_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id uuid REFERENCES public.memories(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.memory_comments TO authenticated;
GRANT ALL ON public.memory_comments TO service_role;
ALTER TABLE public.memory_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Approved see comments" ON public.memory_comments FOR SELECT TO authenticated USING (public.is_approved(auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Approved comment" ON public.memory_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND public.is_approved(auth.uid()));
CREATE POLICY "Owner or admin delete comment" ON public.memory_comments FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

-- =========================
-- STORAGE: gallery bucket
-- =========================
INSERT INTO storage.buckets (id, name, public) VALUES ('gallery','gallery', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read gallery" ON storage.objects FOR SELECT USING (bucket_id = 'gallery');
CREATE POLICY "Approved upload gallery" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'gallery' AND public.is_approved(auth.uid()));
CREATE POLICY "Owner or admin delete gallery" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'gallery' AND (owner = auth.uid() OR public.has_role(auth.uid(),'admin')));

-- profiles bucket for member photos
INSERT INTO storage.buckets (id, name, public) VALUES ('profiles','profiles', true)
ON CONFLICT (id) DO NOTHING;
CREATE POLICY "Public read profiles" ON storage.objects FOR SELECT USING (bucket_id = 'profiles');
CREATE POLICY "Auth upload profile" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'profiles');
CREATE POLICY "Owner update profile photo" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'profiles' AND owner = auth.uid());
CREATE POLICY "Owner delete profile photo" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'profiles' AND owner = auth.uid());
