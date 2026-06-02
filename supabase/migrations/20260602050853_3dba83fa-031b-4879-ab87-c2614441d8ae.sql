
-- Lock down SECURITY DEFINER helpers
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_approved(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_approved(uuid) TO authenticated;

-- Make buckets private; we'll use signed URLs / authenticated access
UPDATE storage.buckets SET public = false WHERE id IN ('gallery','profiles');

-- Replace broad public read with member-only read
DROP POLICY IF EXISTS "Public read gallery" ON storage.objects;
DROP POLICY IF EXISTS "Public read profiles" ON storage.objects;

CREATE POLICY "Approved read gallery" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'gallery' AND (public.is_approved(auth.uid()) OR public.has_role(auth.uid(),'admin')));

CREATE POLICY "Auth read profiles" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'profiles');
