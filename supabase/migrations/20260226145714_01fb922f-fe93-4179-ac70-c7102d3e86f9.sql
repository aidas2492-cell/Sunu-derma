
-- Create role trigger
DROP TRIGGER IF EXISTS on_auth_user_role_created ON auth.users;
CREATE TRIGGER on_auth_user_role_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- Fix all RLS policies from RESTRICTIVE to PERMISSIVE

-- PROFILES
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Doctors can view patient profiles" ON public.profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.consultations c WHERE c.doctor_id = auth.uid() AND c.patient_id = profiles.user_id)
);

-- CONSULTATIONS
DROP POLICY IF EXISTS "Patients see own consultations" ON public.consultations;
DROP POLICY IF EXISTS "Doctors see own consultations" ON public.consultations;
DROP POLICY IF EXISTS "Patients create consultations" ON public.consultations;
DROP POLICY IF EXISTS "Doctors update consultations" ON public.consultations;
CREATE POLICY "Patients see own consultations" ON public.consultations FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Doctors see own consultations" ON public.consultations FOR SELECT USING (auth.uid() = doctor_id);
CREATE POLICY "Patients create consultations" ON public.consultations FOR INSERT WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Doctors update consultations" ON public.consultations FOR UPDATE USING (auth.uid() = doctor_id);

-- MESSAGES
DROP POLICY IF EXISTS "Consultation participants can view messages" ON public.messages;
DROP POLICY IF EXISTS "Consultation participants can send messages" ON public.messages;
CREATE POLICY "Consultation participants can view messages" ON public.messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM consultations c WHERE c.id = messages.consultation_id AND (c.patient_id = auth.uid() OR c.doctor_id = auth.uid()))
);
CREATE POLICY "Consultation participants can send messages" ON public.messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND EXISTS (SELECT 1 FROM consultations c WHERE c.id = messages.consultation_id AND (c.patient_id = auth.uid() OR c.doctor_id = auth.uid()))
);

-- ORDERS
DROP POLICY IF EXISTS "Users create orders" ON public.orders;
DROP POLICY IF EXISTS "Users see own orders" ON public.orders;
CREATE POLICY "Users create orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users see own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);

-- PRESCRIPTIONS
DROP POLICY IF EXISTS "Doctors create prescriptions" ON public.prescriptions;
DROP POLICY IF EXISTS "Doctors see own prescriptions" ON public.prescriptions;
DROP POLICY IF EXISTS "Patients see own prescriptions" ON public.prescriptions;
CREATE POLICY "Doctors create prescriptions" ON public.prescriptions FOR INSERT WITH CHECK (auth.uid() = doctor_id);
CREATE POLICY "Doctors see own prescriptions" ON public.prescriptions FOR SELECT USING (auth.uid() = doctor_id);
CREATE POLICY "Patients see own prescriptions" ON public.prescriptions FOR SELECT USING (auth.uid() = patient_id);

-- SKIN_ANALYSES
DROP POLICY IF EXISTS "Users create analyses" ON public.skin_analyses;
DROP POLICY IF EXISTS "Users see own analyses" ON public.skin_analyses;
CREATE POLICY "Users create analyses" ON public.skin_analyses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users see own analyses" ON public.skin_analyses FOR SELECT USING (auth.uid() = user_id);

-- PRODUCTS
DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
DROP POLICY IF EXISTS "Doctors can manage products" ON public.products;
CREATE POLICY "Anyone can view products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Doctors can manage products" ON public.products FOR ALL USING (has_role(auth.uid(), 'doctor'::app_role));

-- USER_ROLES
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Add delivery address to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address text;
