-- Ensure signup automatically creates profile and role rows
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'on_auth_user_created_profile'
      AND tgrelid = 'auth.users'::regclass
  ) THEN
    CREATE TRIGGER on_auth_user_created_profile
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'on_auth_user_created_role'
      AND tgrelid = 'auth.users'::regclass
  ) THEN
    CREATE TRIGGER on_auth_user_created_role
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();
  END IF;
END
$$;

-- user_roles SELECT policies must be permissive so patient can discover doctors
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;

CREATE POLICY "Users can view own role"
ON public.user_roles
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can view doctor roles"
ON public.user_roles
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (role = 'doctor'::public.app_role);

-- profiles SELECT policies must be permissive for own profile + doctor/patient visibility
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Doctors can view patient profiles" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Doctors can view patient profiles"
ON public.profiles
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.consultations c
    WHERE c.doctor_id = auth.uid()
      AND c.patient_id = profiles.user_id
  )
);

CREATE POLICY "Authenticated users can view doctor profiles"
ON public.profiles
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = profiles.user_id
      AND ur.role = 'doctor'::public.app_role
  )
);