-- Correctifs de sécurité critiques (audit du 26/11/2026)
-- 1. Le rôle n'est plus choisi par le client à l'inscription
-- 2. Les médecins ne peuvent plus modifier le catalogue
-- 3. Les photos de peau ne sont plus publiques
-- 4. Quotas IA comptés côté serveur
-- 5. Le montant des commandes est recalculé côté serveur

-- 1. Rôle à l'inscription : toujours "patient".
-- Un compte médecin est attribué uniquement par un administrateur
-- (tableau de bord Supabase ou fonction serveur), jamais depuis le navigateur.
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'patient'::app_role)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

-- 2. Catalogue : lecture publique, écriture réservée au service (admin via Supabase).
DROP POLICY IF EXISTS "Doctors can manage products" ON public.products;

-- 3. Photos de peau : bucket privé.
UPDATE storage.buckets SET public = false WHERE id = 'skin-analyses';

DROP POLICY IF EXISTS "Public read analysis images" ON storage.objects;

CREATE POLICY "Owners read own analysis images"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'skin-analyses'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Doctors read analysis images of their patients"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'skin-analyses'
  AND public.has_role(auth.uid(), 'doctor'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.consultations c
    WHERE c.doctor_id = auth.uid()
      AND c.patient_id::text = (storage.foldername(name))[1]
  )
);

-- 4. Quotas IA journaliers (fuseau Africa/Dakar), comptés côté serveur.
CREATE TABLE IF NOT EXISTS public.ai_usage (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day date NOT NULL,
  kind text NOT NULL CHECK (kind IN ('analysis', 'chat')),
  count integer NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, day, kind)
);

ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own ai usage"
ON public.ai_usage FOR SELECT TO authenticated
USING (auth.uid() = user_id);
-- Aucune politique INSERT/UPDATE : seul consume_ai_quota peut écrire.

-- Consomme une unité de quota pour l'utilisateur connecté.
-- Renvoie true si l'appel est autorisé, false si la limite du jour est atteinte.
CREATE OR REPLACE FUNCTION public.consume_ai_quota(_kind text, _limit integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _uid uuid := auth.uid();
  _today date := (now() AT TIME ZONE 'Africa/Dakar')::date;
  _new_count integer;
BEGIN
  IF _uid IS NULL THEN
    RETURN false;
  END IF;

  INSERT INTO public.ai_usage (user_id, day, kind, count)
  VALUES (_uid, _today, _kind, 1)
  ON CONFLICT (user_id, day, kind)
  DO UPDATE SET count = public.ai_usage.count + 1
  RETURNING count INTO _new_count;

  RETURN _new_count <= _limit;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_ai_quota(text, integer) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.consume_ai_quota(text, integer) TO authenticated;

-- 5. Commandes : total recalculé à partir des prix en base, statut forcé à "pending".
-- product_ids contient un identifiant par unité (un produit en quantité 2 apparaît 2 fois).
CREATE OR REPLACE FUNCTION public.compute_order_total()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  SELECT COALESCE(SUM(p.price), 0)::integer
  INTO NEW.total
  FROM unnest(NEW.product_ids) AS item(id)
  JOIN public.products p ON p.id = item.id;

  NEW.status := 'pending';
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_compute_total ON public.orders;
CREATE TRIGGER orders_compute_total
BEFORE INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.compute_order_total();

-- 6. Premium : un patient ne peut plus s'activer Premium lui-même.
-- Seul le service (admin via Supabase) peut modifier is_premium.
CREATE OR REPLACE FUNCTION public.protect_premium_flag()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  -- Les requêtes de l'application tournent sous le rôle "authenticated" :
  -- seuls le service et le tableau de bord Supabase peuvent changer ce champ.
  IF NEW.is_premium IS DISTINCT FROM OLD.is_premium
     AND current_user NOT IN ('postgres', 'supabase_admin', 'service_role') THEN
    NEW.is_premium := OLD.is_premium;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_protect_premium ON public.profiles;
CREATE TRIGGER profiles_protect_premium
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_premium_flag();

-- Empêche aussi de créer son profil directement en Premium.
CREATE OR REPLACE FUNCTION public.protect_premium_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF current_user NOT IN ('postgres', 'supabase_admin', 'service_role') THEN
    NEW.is_premium := false;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_protect_premium_insert ON public.profiles;
CREATE TRIGGER profiles_protect_premium_insert
BEFORE INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_premium_on_insert();

-- Demandes d'abonnement : le patient déclare son paiement Wave / Orange Money,
-- l'admin vérifie la transaction puis active Premium dans Supabase.
CREATE TABLE IF NOT EXISTS public.premium_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan text NOT NULL CHECK (plan IN ('simple', 'gold')),
  amount integer NOT NULL,
  payment_method text NOT NULL CHECK (payment_method IN ('wave', 'orange_money')),
  phone text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);

ALTER TABLE public.premium_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own premium requests"
ON public.premium_requests FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users create own premium requests"
ON public.premium_requests FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND status = 'pending' AND reviewed_at IS NULL);

-- Le montant est fixé côté serveur selon l'offre.
CREATE OR REPLACE FUNCTION public.set_premium_request_amount()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.amount := CASE NEW.plan WHEN 'gold' THEN 9000 ELSE 5500 END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS premium_requests_amount ON public.premium_requests;
CREATE TRIGGER premium_requests_amount
BEFORE INSERT ON public.premium_requests
FOR EACH ROW EXECUTE FUNCTION public.set_premium_request_amount();
